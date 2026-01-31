'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import ImageUploadToolbar from './ImageUploadToolbar';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Message } from '@arco-design/web-react';

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
  enableImageUpload?: boolean;
}

export default function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  height = 260,
  className,
  enableImageUpload = true,
}: MarkdownEditorProps) {
  const [isDark, setIsDark] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const { upload, uploading } = useImageUpload({
    onSuccess: (images) => {
      const md = images.map((img) => `![image](${img.url})`).join('\n');
      insertAtCursor(md);
      Message.success(`${images.length} image(s) uploaded`);
    },
    onError: (err) => Message.error(err),
  });

  const insertAtCursor = useCallback(
    (text: string) => {
      const ed = editorRef.current;
      if (ed) {
        const selection = ed.getSelection();
        if (selection) {
          ed.executeEdits('', [{ range: selection, text, forceMoveMarkers: true }]);
        }
      } else {
        onChange?.((value || '') + '\n' + text);
      }
    },
    [onChange, value]
  );

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

  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!enableImageUpload) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles = items
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (imageFiles.length > 0) {
        e.preventDefault();
        await upload(imageFiles);
      }
    },
    [enableImageUpload, upload]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!enableImageUpload) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length > 0) {
        e.preventDefault();
        await upload(files);
      }
    },
    [enableImageUpload, upload]
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-colors duration-300 dark:border-gray-600 dark:bg-gray-800 ${className || ''}`}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => enableImageUpload && e.preventDefault()}
    >
      {enableImageUpload && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <ImageUploadToolbar onInsert={insertAtCursor} disabled={uploading} />
        </div>
      )}
      <div style={{ height }}>
        {!value && placeholder ? (
          <span className="pointer-events-none absolute left-4 top-12 text-sm text-gray-400">
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
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
