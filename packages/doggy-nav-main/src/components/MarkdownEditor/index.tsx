'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { editor } from 'monaco-editor';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-60 items-center justify-center text-sm text-theme-muted-foreground">
      Loading editor...
    </div>
  ),
}) as typeof import('@monaco-editor/react').default;

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  className?: string;
}

export default function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  height = 260,
  className,
}: MarkdownEditorProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const editorOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      minimap: { enabled: false },
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'off',
      renderLineHighlight: 'none',
      fontSize: 14,
      padding: { top: 12, bottom: 12 },
    }),
    []
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-colors duration-300 dark:border-gray-600 dark:bg-gray-800 ${className || ''}`}
      style={{ height }}
    >
      {!value && placeholder ? (
        <span className="pointer-events-none absolute left-4 top-3 text-sm text-gray-400">
          {placeholder}
        </span>
      ) : null}
      <MonacoEditor
        value={value}
        onChange={(val) => onChange?.(val ?? '')}
        theme={isDark ? 'vs-dark' : 'vs'}
        language="markdown"
        height="100%"
        options={editorOptions}
      />
    </div>
  );
}
