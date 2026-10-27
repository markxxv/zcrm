import { useMemo, useRef } from 'react';
import YooptaEditor, { createYooptaEditor, YooptaContentValue, YooptaOnChangeOptions } from '@yoopta/editor';

// Plugins
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import Divider from '@yoopta/divider';
import Callout from '@yoopta/callout';
import Link from '@yoopta/link';
import Table from '@yoopta/table';

// Marks
import { Bold, Italic, CodeMark, Strike, Underline, Highlight } from '@yoopta/marks';

// Tools
import ActionMenu, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';

interface TaskEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const PLUGINS = [
  Paragraph,
  Table,
  Divider,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
];

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const TOOLS = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  ActionMenu: {
    tool: ActionMenu,
    render: DefaultActionMenuRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

export function TaskEditor({ content, onChange, placeholder = 'Type / for commands...' }: TaskEditorProps) {
  const editor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef<HTMLDivElement>(null);

  const parsedValue = useMemo(() => {
    if (!content || content === '') {
      return undefined;
    }
    try {
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }, [content]);

  const handleChange = (value: YooptaContentValue, options: YooptaOnChangeOptions) => {
    onChange(JSON.stringify(value));
  };

  return (
    <div 
      ref={selectionRef}
      className="yoopta-container min-h-[300px] bg-gray-50 dark:bg-zinc-900 px-4 mt-2 p-2 rounded-lg"
    >
      <YooptaEditor
        editor={editor}
        plugins={PLUGINS as unknown as React.ComponentProps<typeof YooptaEditor>['plugins']}
        marks={MARKS}
        tools={TOOLS}
        value={parsedValue}
        onChange={handleChange}
        placeholder="....."
        selectionBoxRoot={selectionRef}
        autoFocus={false}
      />
      

    </div>
  );
}