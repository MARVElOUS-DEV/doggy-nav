'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 {...props} className="text-3xl font-bold mt-6 mb-4 text-theme-foreground">
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 {...props} className="text-2xl font-semibold mt-5 mb-3 text-theme-foreground">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} className="text-xl font-semibold mt-4 mb-2 text-theme-foreground">
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="mb-4 leading-relaxed text-theme-muted-foreground">
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="mb-4 list-disc space-y-2 pl-6 text-theme-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="mb-4 list-decimal space-y-2 pl-6 text-theme-muted-foreground">
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-theme-border bg-theme-color/40 px-4 py-2 italic text-theme-muted-foreground"
    >
      {children}
    </blockquote>
  ),
  code({ inline, children, ...props }) {
    if (inline) {
      return (
        <code
          {...props}
          className="rounded-md bg-theme-color px-1.5 py-0.5 text-sm text-theme-foreground"
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-xl bg-theme-color p-4 text-sm text-theme-foreground">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ children, ...props }) => (
    <a
      {...props}
      className="text-theme-primary underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto">
      <table {...props} className="w-full text-left text-sm text-theme-foreground">
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th {...props} className="border border-theme-border px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-theme-border px-3 py-2">
      {children}
    </td>
  ),
};

interface MarkdownContentProps {
  value?: string;
  className?: string;
  fallback?: ReactNode;
}

export default function MarkdownContent({ value, className, fallback }: MarkdownContentProps) {
  if (!value?.trim()) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {value}
      </ReactMarkdown>
    </div>
  );
}
