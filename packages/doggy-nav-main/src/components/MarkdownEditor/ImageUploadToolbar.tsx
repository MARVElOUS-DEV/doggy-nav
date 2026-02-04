'use client';

import { useRef, useCallback } from 'react';
import { IconImage, IconLoading } from '@arco-design/web-react/icon';
import { Message, Tooltip } from '@arco-design/web-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploadToolbarProps {
  onInsert: (markdown: string) => void;
  disabled?: boolean;
  imageHostname?: string;
}

export default function ImageUploadToolbar({ onInsert, disabled, imageHostname }: ImageUploadToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { upload, uploading, progress } = useImageUpload({
    imageHostname,
    onSuccess: (images) => {
      const md = images.map((img) => `![image](${img.url})`).join('\n');
      onInsert(md);
      Message.success(`${images.length} image(s) uploaded`);
    },
    onError: (err) => Message.error(err),
  });

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) inputRef.current?.click();
  }, [disabled, uploading]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) await upload(files);
      e.target.value = '';
    },
    [upload]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Tooltip content={uploading ? `Uploading ${progress}%` : 'Upload images (max 3)'}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <IconLoading className="text-blue-500 animate-spin" />
          ) : (
            <IconImage className="text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </Tooltip>
    </>
  );
}
