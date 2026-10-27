import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes, type Editor as TiptapEditor } from '@tiptap/core';
import {
    Bold, Italic, Underline, Strikethrough, Code2, Highlighter, Link2,
    List, ListOrdered, ListTodo, Quote, Table2, ImagePlus, Type,
    Heading1, Heading2, Heading3, Minus, X, LoaderCircle, Undo2, Redo2,
    Rows3, Columns3, Trash2, Plus, GripVertical, Search, ChevronRight,
} from 'lucide-react';
import { readTaskDescription } from '@/lib/legacy-task-content';
import { uploadTaskEditorImage } from '@/lib/task-editor-upload';

type Props = {
    taskId: number;
    content: string;
    onChange: (content: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
    placeholder?: string;
};

const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,
    parseHTML: () => [{ tag: 'aside[data-type="callout"]' }],
    renderHTML: ({ HTMLAttributes }) => ['aside', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0],
});

type CommandId = 'paragraph' | 'heading1' | 'heading2' | 'heading3'
    | 'bullet' | 'ordered' | 'todo' | 'quote' | 'callout' | 'code'
    | 'divider' | 'table' | 'image';

type SlashMenu = { from: number; to: number; query: string; left: number; top: number };
type BlockHover = { index: number; top: number };

const BLOCK_MIME = 'application/x-zcrm-editor-block';

const COMMANDS = [
    { id: 'paragraph', label: 'Text', hint: 'Plain text', icon: Type },
    { id: 'heading1', label: 'Heading 1', hint: 'Large heading', icon: Heading1 },
    { id: 'heading2', label: 'Heading 2', hint: 'Medium heading', icon: Heading2 },
    { id: 'heading3', label: 'Heading 3', hint: 'Small heading', icon: Heading3 },
    { id: 'bullet', label: 'Bulleted list', hint: 'List with bullets', icon: List },
    { id: 'ordered', label: 'Numbered list', hint: 'Numbered items', icon: ListOrdered },
    { id: 'todo', label: 'Checklist', hint: 'Tasks with checkboxes', icon: ListTodo },
    { id: 'quote', label: 'Quote', hint: 'Highlight a quotation', icon: Quote },
    { id: 'callout', label: 'Callout', hint: 'Highlight a block', icon: Highlighter },
    { id: 'code', label: 'Code block', hint: 'Code snippet', icon: Code2 },
    { id: 'divider', label: 'Divider', hint: 'Horizontal line', icon: Minus },
    { id: 'table', label: 'Table', hint: '3 × 3 table', icon: Table2 },
    { id: 'image', label: 'Image', hint: 'Upload a picture', icon: ImagePlus },
] as const;

function filteredCommands(query: string) {
    const value = query.trim().toLowerCase();
    return COMMANDS.filter((item) => (item.label + ' ' + item.hint).toLowerCase().includes(value));
}

function blockOffset(editor: TiptapEditor, index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) offset += editor.state.doc.child(i).nodeSize;
    return offset;
}

function moveBlock(editor: TiptapEditor, fromIndex: number, toIndex: number) {
    const doc = editor.state.doc;
    if (fromIndex < 0 || fromIndex >= doc.childCount || toIndex < 0 || toIndex > doc.childCount) return;
    if (toIndex === fromIndex || toIndex === fromIndex + 1) return;
    const node = doc.child(fromIndex);
    const from = blockOffset(editor, fromIndex);
    let destination = blockOffset(editor, toIndex);
    const transaction = editor.state.tr.delete(from, from + node.nodeSize);
    if (toIndex > fromIndex) destination -= node.nodeSize;
    editor.view.dispatch(transaction.insert(destination, node).scrollIntoView());
}

function runCommand(editor: TiptapEditor, id: CommandId, imagePicker: () => void) {
    const chain = editor.chain().focus();
    switch (id) {
        case 'paragraph': chain.setParagraph().run(); break;
        case 'heading1': chain.toggleHeading({ level: 1 }).run(); break;
        case 'heading2': chain.toggleHeading({ level: 2 }).run(); break;
        case 'heading3': chain.toggleHeading({ level: 3 }).run(); break;
        case 'bullet': chain.toggleBulletList().run(); break;
        case 'ordered': chain.toggleOrderedList().run(); break;
        case 'todo': chain.toggleTaskList().run(); break;
        case 'quote': chain.toggleBlockquote().run(); break;
        case 'callout': chain.wrapIn('callout').run(); break;
        case 'code': chain.toggleCodeBlock().run(); break;
        case 'divider': chain.setHorizontalRule().run(); break;
        case 'table': chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
        case 'image': imagePicker(); break;
    }
}

const bubbleButton = 'grid size-8 shrink-0 place-items-center rounded-md text-zinc-300 hover:bg-white/15 hover:text-white transition-colors';

export function TaskEditor({ taskId, content, onChange, onUploadingChange, placeholder = 'Write a description…' }: Props) {
    const uploadChangeRef = useRef(onUploadingChange);
    uploadChangeRef.current = onUploadingChange;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const uploadingRef = useRef(false);
    const abort = useRef<AbortController | null>(null);
    const filePicker = useRef<HTMLInputElement>(null);
    const dragDepth = useRef(0);
    const [dragging, setDragging] = useState(false);
    const [upload, setUpload] = useState<{ preview: string; name: string; progress: number } | null>(null);
    const [error, setError] = useState('');
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [slash, setSlash] = useState<SlashMenu | null>(null);
    const slashRef = useRef<SlashMenu | null>(null);
    const [selectedCommand, setSelectedCommand] = useState(0);
    const selectedRef = useRef(0);
    const [hover, setHover] = useState<BlockHover | null>(null);
    const [movingBlock, setMovingBlock] = useState(false);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const syncSlashRef = useRef<(instance: TiptapEditor) => void>(() => {});
    const selectCommandRef = useRef<(id: CommandId) => void>(() => {});
    const [selectionVersion, setSelectionVersion] = useState(0);
    void selectionVersion;

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            TaskList,
            TaskItem.configure({ nested: true }),
            TableKit.configure({ table: { resizable: true } }),
            Image.configure({
                allowBase64: false,
                resize: { enabled: true, directions: ['bottom-right'], minWidth: 80, alwaysPreserveAspectRatio: true },
            }),
            Highlight,
            Typography,
            Placeholder.configure({ placeholder }),
            Callout,
        ],
        content: readTaskDescription(content),
        onUpdate: ({ editor: instance }) => {
            onChangeRef.current(JSON.stringify(instance.getJSON()));
            syncSlashRef.current(instance);
        },
        onSelectionUpdate: ({ editor: instance }) => {
            syncSlashRef.current(instance);
            setSelectionVersion((value) => value + 1);
        },
        editorProps: {
            attributes: { class: 'tiptap min-h-44 outline-none' },
            handleKeyDown: (_view, event) => {
                const menu = slashRef.current;
                if (!menu) return false;
                const available = filteredCommands(menu.query);
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (available.length === 0) return true;
                    const offset = event.key === 'ArrowDown' ? 1 : -1;
                    selectedRef.current = (selectedRef.current + offset + available.length) % available.length;
                    setSelectedCommand(selectedRef.current);
                    return true;
                }
                if (event.key === 'Enter' && available.length) {
                    event.preventDefault();
                    selectCommandRef.current(available[Math.min(selectedRef.current, available.length - 1)].id);
                    return true;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    // Escape closes the menu and removes only the slash query.
                    const instance = slashRef.current;
                    slashRef.current = null;
                    setSlash(null);
                    if (instance) _view.dispatch(_view.state.tr.delete(instance.from, instance.to));
                    return true;
                }
                return false;
            },
        },
    });

    // Position the command palette relative to the drawer, not the scrolling editor body.
    // This keeps the menu visible even when the editor is near the bottom of a task.
    const syncSlash = (instance: TiptapEditor) => {
        if (!instance.isFocused || !instance.state.selection.empty) {
            slashRef.current = null;
            setSlash(null);
            return;
        }
        const { $from } = instance.state.selection;
        if ($from.parent.type.name !== 'paragraph') {
            slashRef.current = null;
            setSlash(null);
            return;
        }
        const before = $from.parent.textBetween(0, $from.parentOffset);
        const matched = before.match(/^\/([a-z0-9 -]{0,40})$/i);
        if (!matched) {
            slashRef.current = null;
            setSlash(null);
            return;
        }

        const rect = instance.view.coordsAtPos($from.pos);
        const host = rootRef.current?.closest<HTMLElement>('[data-vaul-drawer]') ?? document.body;
        const bounds = host === document.body
            ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
            : host.getBoundingClientRect();
        const width = Math.min(280, bounds.width - 16);
        const height = 338;
        const left = Math.max(8, Math.min(rect.left - bounds.left, bounds.width - width - 8));
        const bottomSpace = bounds.top + bounds.height - rect.bottom;
        const top = bottomSpace > 200
            ? rect.bottom - bounds.top + 8
            : Math.max(8, rect.top - bounds.top - height - 8);

        const next = { from: $from.pos - matched[0].length, to: $from.pos, query: matched[1], left, top };
        if (slashRef.current?.query !== next.query) {
            selectedRef.current = 0;
            setSelectedCommand(0);
        }
        slashRef.current = next;
        setSlash(next);
    };
    syncSlashRef.current = syncSlash;

    const chooseCommand = (id: CommandId) => {
        if (!editor) return;
        const current = slashRef.current;
        slashRef.current = null;
        setSlash(null);
        if (current) editor.chain().focus().deleteRange({ from: current.from, to: current.to }).run();
        runCommand(editor, id, () => filePicker.current?.click());
    };
    selectCommandRef.current = chooseCommand;

    useEffect(() => {
        if (!editor) return;
        const reposition = () => {
            if (slashRef.current) syncSlashRef.current(editor);
        };
        document.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            document.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [editor]);

    const pickBlockIndex = (event: MouseEvent<HTMLDivElement>): number | null => {
        if (!editor) return null;
        const element = event.target;
        if (!(element instanceof HTMLElement)) return null;
        if (element.closest('[data-task-block-controls]')) return null;
        let node: HTMLElement | null = element;
        while (node && node.parentElement !== editor.view.dom) node = node.parentElement;
        if (!node) return null;
        const index = Array.from(editor.view.dom.children).indexOf(node);
        return index >= 0 && index < editor.state.doc.childCount ? index : null;
    };

    const trackBlock = (event: MouseEvent<HTMLDivElement>) => {
        if (!editor || !rootRef.current || movingBlock) return;
        const index = pickBlockIndex(event);
        if (index === null) return;
        const block = editor.view.dom.children[index] as HTMLElement | undefined;
        if (!block) return;
        const top = block.getBoundingClientRect().top - rootRef.current.getBoundingClientRect().top + 2;
        setHover((previous) => previous?.index === index && Math.abs(previous.top - top) < 1
            ? previous : { index, top });
    };

    const addBlockAfter = (index: number) => {
        if (!editor) return;
        const at = blockOffset(editor, index + 1);
        editor.chain().focus().insertContentAt(at, {
            type: 'paragraph', content: [{ type: 'text', text: '/' }],
        }).setTextSelection(at + 2).run();
        syncSlashRef.current(editor);
        setHover(null);
    };

    function targetIndexAt(clientY: number): number {
        if (!editor) return 0;
        const children = Array.from(editor.view.dom.children);
        for (let index = 0; index < children.length; index++) {
            const rect = children[index].getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) return index;
        }
        return editor.state.doc.childCount;
    }

    useEffect(() => () => {
        abort.current?.abort();
        uploadChangeRef.current?.(false);
    }, []);

    async function uploadFiles(files: File[]) {
        if (!editor || uploadingRef.current || files.length === 0) return;
        uploadingRef.current = true;
        uploadChangeRef.current?.(true);
        const controller = new AbortController();
        abort.current = controller;
        setError('');
        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) throw new Error('Drop an image (JPG, PNG, GIF or WebP).');
                const preview = URL.createObjectURL(file);
                setUpload({ preview, name: file.name, progress: 0 });
                try {
                    const url = await uploadTaskEditorImage(file, taskId, (progress) => {
                        if (!controller.signal.aborted) setUpload({ preview, name: file.name, progress });
                    }, controller.signal);
                    if (!controller.signal.aborted) {
                        // The entire editor is a drop target. Images are added as their own blocks.
                        // Never require a precise text cursor position to drop a file.
                        editor.chain().focus('end').setImage({ src: url, alt: file.name }).run();
                    }
                } finally {
                    URL.revokeObjectURL(preview);
                }
            }
        } catch (caught) {
            if (!controller.signal.aborted) {
                setError(caught instanceof Error ? caught.message : 'Image upload failed.');
            }
        } finally {
            uploadingRef.current = false;
            abort.current = null;
            uploadChangeRef.current?.(false);
            setUpload(null);
        }
    }

    function onDragEnter(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        dragDepth.current++;
        setDragging(true);
    }

    function onDragLeave(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
    }

    function onDrop(event: DragEvent<HTMLDivElement>) {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        event.stopPropagation();
        dragDepth.current = 0;
        setDragging(false);
        void uploadFiles(Array.from(event.dataTransfer.files));
    }

    function onPaste(event: ClipboardEvent<HTMLDivElement>) {
        const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'));
        if (!files.length) return;
        event.preventDefault();
        event.stopPropagation();
        void uploadFiles(files);
    }

    function withUrl() {
        if (!editor) return;
        const previous = editor.getAttributes('link').href || '';
        const href = window.prompt('Link URL', previous);
        if (href === null) return;
        if (!href.trim()) return void editor.chain().focus().unsetLink().run();
        const normalized = /^(https?:\/\/|mailto:)/i.test(href) ? href : 'https://' + href;
        editor.chain().focus().setLink({ href: normalized }).run();
    }

    if (!editor) return <div className="min-h-44 rounded-lg bg-muted/30" />;

    const items = slash ? filteredCommands(slash.query) : [];
    const menuHost = rootRef.current?.closest<HTMLElement>('[data-vaul-drawer]') ?? document.body;

    function tool(title: string, icon: React.ReactNode, action: () => void, active = false, disabled = false) {
        return <button type="button" key={title} title={title} aria-label={title} aria-pressed={active}
            disabled={disabled} className={bubbleButton + (active ? ' bg-white/20 text-white' : '')}
            onMouseDown={(event) => event.preventDefault()} onClick={action}>{icon}</button>;
    }

    const palette = slash && createPortal(
        <div role="listbox" aria-label="Insert block" className="absolute z-[80] w-[min(280px,calc(100vw-32px))] overflow-hidden rounded-xl bg-zinc-900 p-1.5 text-zinc-100 shadow-2xl ring-1 ring-white/10"
            style={{ left: slash.left, top: slash.top }} onMouseDown={(event) => event.preventDefault()}>
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400">
                <Search className="size-3.5" />
                <span className="flex-1 truncate">Insert a block</span>
                <kbd className="text-[10px] text-zinc-500">↑↓ Enter</kbd>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
                {items.map((item, index) => {
                    const Icon = item.icon;
                    return <button key={item.id} type="button" role="option"
                        aria-selected={selectedCommand === index}
                        onMouseEnter={() => { selectedRef.current = index; setSelectedCommand(index); }}
                        onClick={() => chooseCommand(item.id)}
                        className={'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ' +
                            (selectedCommand === index ? 'bg-blue-600 text-white' : 'text-zinc-200 hover:bg-zinc-700')}>
                        <span className={'grid size-8 shrink-0 place-items-center rounded-md ' +
                            (selectedCommand === index ? 'bg-white/15' : 'bg-white/5')}>
                            <Icon className="size-[17px]" strokeWidth={1.7} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium">{item.label}</span>
                            <span className={'block text-[11px] ' +
                                (selectedCommand === index ? 'text-blue-100' : 'text-zinc-500')}>{item.hint}</span>
                        </span>
                        {selectedCommand === index && <ChevronRight className="size-3.5 opacity-70" />}
                    </button>;
                })}
                {items.length === 0 && <p className="px-3 py-5 text-center text-xs text-zinc-400">No matching blocks</p>}
            </div>
        </div>,
        menuHost,
    );

    return <div className="relative overflow-hidden rounded-xl bg-muted/30"
        onDragEnterCapture={onDragEnter}
        onDragOverCapture={(event) => {
            if (event.dataTransfer.types.includes('Files')) {
                event.preventDefault();
                event.dataTransfer.dropEffect = uploadingRef.current ? 'none' : 'copy';
            }
        }}
        onDragLeaveCapture={onDragLeave}
        onDropCapture={onDrop}
        onPasteCapture={onPaste}>
        <input ref={filePicker} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
            multiple className="sr-only" onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                void uploadFiles(files);
            }} />

        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2">
            {tool('Bold', <Bold className="size-4" />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
            {tool('Italic', <Italic className="size-4" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
            {tool('Underline', <Underline className="size-4" />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
            {tool('Strike', <Strikethrough className="size-4" />, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
            {tool('Highlight', <Highlighter className="size-4" />, () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'))}
            {tool('Code', <Code2 className="size-4" />, () => editor.chain().focus().toggleCode().run(), editor.isActive('code'))}
            {tool('Link', <Link2 className="size-4" />, withUrl, editor.isActive('link'))}
            <span className="mx-1 h-4 w-px bg-border/70" />
            {tool('Heading 1', <Heading1 className="size-4" />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
            {tool('Heading 2', <Heading2 className="size-4" />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
            {tool('Heading 3', <Heading3 className="size-4" />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
            {tool('Bulleted list', <List className="size-4" />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
            {tool('Numbered list', <ListOrdered className="size-4" />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
            {tool('Checklist', <ListTodo className="size-4" />, () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
            {tool('Quote', <Quote className="size-4" />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
            {tool('Table', <Table2 className="size-4" />, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), editor.isActive('table'))}
            {tool('Divider', <Minus className="size-4" />, () => editor.chain().focus().setHorizontalRule().run())}
            {tool('Add image', <ImagePlus className="size-4" />, () => filePicker.current?.click())}
            <span className="ml-auto" />
            {tool('Undo', <Undo2 className="size-4" />, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
            {tool('Redo', <Redo2 className="size-4" />, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
        </div>

        {editor.isActive('table') && <div className="flex items-center gap-1 px-2 pb-1">
            {tool('Add row', <Rows3 className="size-4" />, () => editor.chain().focus().addRowAfter().run())}
            {tool('Add column', <Columns3 className="size-4" />, () => editor.chain().focus().addColumnAfter().run())}
            {tool('Remove row', <Minus className="size-4" />, () => editor.chain().focus().deleteRow().run())}
            {tool('Remove column', <Minus className="size-4" />, () => editor.chain().focus().deleteColumn().run())}
            {tool('Delete table', <Trash2 className="size-4" />, () => editor.chain().focus().deleteTable().run())}
        </div>}

        <div className="task-rich-editor min-h-48 px-4 pb-4 pt-2"
            onClick={(event) => {
                const target = event.target;
                if (target instanceof HTMLImageElement && target.closest('.tiptap')) setLightbox(target.src);
            }}>
            <EditorContent editor={editor} />
        </div>

        {shown.length > 0 && <div className="absolute left-4 top-12 z-30 w-56 max-h-64 overflow-y-auto rounded-lg bg-popover p-1 shadow-lg ring-1 ring-border/60">
            {shown.map((command) => <button type="button" key={command.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => execute(command)}
                className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted">
                {command.label}
            </button>)}
        </div>}

        {dragging && <div className="pointer-events-none absolute inset-1 z-20 grid place-items-center rounded-lg bg-background/90 ring-2 ring-foreground/50">
            <div className="flex flex-col items-center gap-2 text-sm">
                <ImagePlus className="size-7" />
                <span>Drop image anywhere</span>
            </div>
        </div>}

        {upload && <div className="mx-3 mb-3 flex items-center gap-3 rounded-lg bg-background p-2.5 text-xs">
            <img src={upload.preview} alt="" className="size-12 shrink-0 rounded object-cover" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <LoaderCircle className="size-3 animate-spin" />
                    <span className="min-w-0 flex-1 truncate">{upload.name}</span>
                    <span className="tabular-nums">{upload.progress}%</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: upload.progress + '%' }} />
                </div>
            </div>
        </div>}

        {error && <div role="alert" className="mx-3 mb-3 flex items-center justify-between gap-2 text-xs text-red-500">
            <span>{error}</span>
            <button type="button" title="Dismiss" onClick={() => setError('')}><X className="size-4" /></button>
        </div>}

        {lightbox && <div role="dialog" aria-modal="true" aria-label="Image preview"
            className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-5"
            onClick={() => setLightbox(null)}>
            <button type="button" className="absolute right-5 top-5 text-white" onClick={() => setLightbox(null)} aria-label="Close"><X className="size-6" /></button>
            <img src={lightbox} alt="" className="max-h-[90vh] max-w-full object-contain" />
        </div>}
    </div>;
}
