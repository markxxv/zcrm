import type { JSONContent } from '@tiptap/core';

type LegacyNode = {
    type?: string;
    text?: string;
    children?: LegacyNode[];
    props?: Record<string, unknown>;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    code?: boolean;
    highlight?: boolean | Record<string, unknown>;
    link?: { url?: string; href?: string };
};
type LegacyBlock = {
    type?: string;
    value?: LegacyNode[];
    meta?: { order?: number; depth?: number };
};

const paragraph = (content: JSONContent[] = []): JSONContent => ({ type: 'paragraph', content });

function textFrom(nodes: LegacyNode[] = []): string {
    return nodes.map((node) => (node.text ?? '') + textFrom(node.children ?? [])).join('');
}

function inline(nodes: LegacyNode[] = []): JSONContent[] {
    const output: JSONContent[] = [];
    for (const node of nodes) {
        if (typeof node.text === 'string' && node.text.length > 0) {
            const marks: JSONContent[] = [];
            for (const key of ['bold', 'italic', 'underline', 'strike', 'code'] as const) {
                if (node[key]) marks.push({ type: key });
            }
            if (node.highlight) marks.push({ type: 'highlight' });
            const href = node.link?.url || node.link?.href ||
                (typeof node.props?.url === 'string' ? node.props.url : null);
            if (href && /^(https?:\/\/|mailto:)/i.test(href)) marks.push({ type: 'link', attrs: { href } });
            output.push({ type: 'text', text: node.text, ...(marks.length ? { marks } : {}) });
        }
        if (node.children) output.push(...inline(node.children));
    }
    return output;
}

function fallbackText(block: LegacyBlock): JSONContent {
    return paragraph(inline(block.value ?? []));
}

function convertBlock(block: LegacyBlock): JSONContent[] {
    const type = (block.type || '').toLowerCase();
    const value = block.value ?? [];
    const content = inline(value);
    if (type === 'divider' || type === 'horizontalrule') return [{ type: 'horizontalRule' }];
    if (type === 'headingone' || type === 'headingtwo' || type === 'headingthree') {
        return [{ type: 'heading', attrs: { level: { headingone: 1, headingtwo: 2, headingthree: 3 }[type] }, content }];
    }
    if (type === 'blockquote' || type === 'callout') {
        return [{ type: type === 'callout' ? 'callout' : 'blockquote', content: [paragraph(content)] }];
    }
    if (type === 'code' || type === 'codeblock') {
        return [{ type: 'codeBlock', content: [{ type: 'text', text: textFrom(value) || ' ' }] }];
    }
    if (type === 'bulletedlist' || type === 'numberedlist' || type === 'todolist') {
        const listType = type === 'bulletedlist' ? 'bulletList' : type === 'numberedlist' ? 'orderedList' : 'taskList';
        const item = type === 'todolist' ? 'taskItem' : 'listItem';
        const checked = value.some((node) => node.props?.checked === true);
        return [{ type: listType, content: [{ type: item, ...(item === 'taskItem' ? { attrs: { checked } } : {}), content: [paragraph(content)] }] }];
    }
    if (type === 'table') {
        // Older Yoopta tables have varying nested structures; preserve their text rather
        // than silently dropping unknown cells. Table-shaped data gets converted below.
        const table = value.find((node) => /table/i.test(node.type || '')) ?? value[0];
        const rows = (table?.children ?? value).filter((node) => /row/i.test(node.type || ''));
        if (rows.length) {
            const converted = rows.map((row) => ({
                type: 'tableRow',
                content: (row.children ?? []).map((cell) => ({
                    type: /header/i.test(cell.type || '') ? 'tableHeader' : 'tableCell',
                    content: [paragraph(inline(cell.children ?? []))],
                })),
            })).filter((row) => row.content.length > 0);
            if (converted.length) return [{ type: 'table', content: converted }];
        }
    }
    return [fallbackText(block)];
}

/** Read both new Tiptap documents and existing Yoopta v4 JSON without a destructive migration. */
export function readTaskDescription(value: string): JSONContent {
    const empty: JSONContent = { type: 'doc', content: [paragraph()] };
    if (!value.trim()) return empty;

    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch {
        return { type: 'doc', content: [paragraph([{ type: 'text', text: value }])] };
    }

    if (!parsed || typeof parsed !== 'object') return empty;
    if ((parsed as JSONContent).type === 'doc') return parsed as JSONContent;

    const blocks = Array.isArray(parsed)
        ? parsed as LegacyBlock[]
        : Object.values(parsed as Record<string, LegacyBlock>);
    const content = blocks
        .filter((block): block is LegacyBlock => !!block && typeof block === 'object')
        .sort((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0))
        .flatMap(convertBlock);
    return { type: 'doc', content: content.length ? content : [paragraph()] };
}
