import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import {
    Bold, Italic, Underline, Strikethrough, Code2, Highlighter, Link2,
    List, ListOrdered, ListTodo, Quote, Table2, ImagePlus,
    Heading1, Heading2, Heading3, Minus, X, LoaderCircle, Undo2, Redo2,
    Rows3, Columns3, Trash2,
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

type Command = { label: string; action: () => void };
const toolClass = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30';
const selectedClass = 'bg-muted text-foreground';

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
    const [slash, setSlash] = useState<string | null>(null);
    const [, setSelectionVersion] = useState(0);

    const editor = useEditor({
        immediatelyRender: false,
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
        editorProps: { attributes: { class: 'tiptap min-h-44 outline-none' } },
        onUpdate: ({ editor: instance }) => {
            onChangeRef.current(JSON.stringify(instance.getJSON()));
            const { $from } = instance.state.selection;
            const before = $from.parent.textBetween(0, $from.parentOffset);
            const match = $from.parent.type.name === 'paragraph' ? before.match(/^\/([a-z0-9 -]*)$/i) : null;
            setSlash(match ? match[1].toLowerCase() : null);
        },
        onSelectionUpdate: () => setSelectionVersion((value) => value + 1),
    });

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

    const commands: Command[] = [
        { label: 'Text', action: () => editor.chain().focus().setParagraph().run() },
        { label: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
        { label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: 'Bulleted list', action: () => editor.chain().focus().toggleBulletList().run() },
        { label: 'Numbered list', action: () => editor.chain().focus().toggleOrderedList().run() },
        { label: 'Checklist', action: () => editor.chain().focus().toggleTaskList().run() },
        { label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run() },
        { label: 'Callout', action: () => editor.chain().focus().wrapIn('callout').run() },
        { label: 'Code block', action: () => editor.chain().focus().toggleCodeBlock().run() },
        { label: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
        { label: 'Table', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
        { label: 'Image', action: () => filePicker.current?.click() },
    ];
    const shown = slash === null ? [] : commands.filter((command) =>
        command.label.toLowerCase().includes(slash)
    ).slice(0, 8);

    function execute(command: Command) {
        if (!editor) return;
        if (slash !== null) {
            const end = editor.state.selection.from;
            editor.chain().focus().deleteRange({ from: end - slash.length - 1, to: end }).run();
        }
        setSlash(null);
        command.action();
    }

    function tool(title: string, icon: React.ReactNode, action: () => void, active = false, disabled = false) {
        return <button type="button" key={title} title={title} aria-label={title} aria-pressed={active}
            disabled={disabled} className={toolClass + (active ? ' ' + selectedClass : '')}
            onMouseDown={(event) => event.preventDefault()} onClick={action}>{icon}</button>;
    }

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
