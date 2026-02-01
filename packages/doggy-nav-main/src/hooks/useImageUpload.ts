import { useState, useCallback } from 'react';
import axios from '@/utils/axios';

interface UploadedImage {
  url: string;
  key: string;
  size: number;
}

interface UseImageUploadOptions {
  maxFiles?: number;
  maxSizeMb?: number;
  onSuccess?: (images: UploadedImage[]) => void;
  onError?: (error: string) => void;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];

// Use standalone image service if configured, otherwise use main backend
const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || '';

async function getAccessToken(): Promise<string | null> {
  try {
    const res: any = await axios.get('/api/auth/token');
    return res?.token || null;
  } catch {
    return null;
  }
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { maxFiles = 3, maxSizeMb = 3, onSuccess, onError } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      if (files.length > maxFiles) {
        return `Maximum ${maxFiles} files allowed`;
      }
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return `Invalid file type: ${file.type}`;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
          return `File "${file.name}" exceeds ${maxSizeMb}MB limit`;
        }
      }
      return null;
    },
    [maxFiles, maxSizeMb]
  );

  const upload = useCallback(
    async (files: File[]): Promise<UploadedImage[] | null> => {
      const error = validateFiles(files);
      if (error) {
        onError?.(error);
        return null;
      }

      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const uploadUrl = IMAGE_SERVICE_URL
          ? `${IMAGE_SERVICE_URL}/upload`
          : '/api/images/upload';

        const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };

        // For external image service, get token from backend and add Authorization header
        if (IMAGE_SERVICE_URL) {
          const token = await getAccessToken();
          if (!token) {
            onError?.('Authentication required');
            return null;
          }
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response: any = await axios.post(uploadUrl, formData, {
          headers,
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });

        const images = response?.images || response?.data?.images || [];
        onSuccess?.(images);
        return images;
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Upload failed';
        onError?.(msg);
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [validateFiles, onSuccess, onError]
  );

  return { upload, uploading, progress, validateFiles };
}
