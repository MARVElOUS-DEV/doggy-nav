import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@arco-design/web-react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { BookmarkOrganizeResponse } from 'doggy-nav-core';
import api from '@/utils/api';
import type { BookmarkDocument } from '../model';
import { AI_ORGANIZE_MAX_ITEMS, documentToBookmarkOrganizeRequest } from '../aiOrganizeDocument';

interface Props {
  document: BookmarkDocument;
  onOrganized: (response: BookmarkOrganizeResponse) => Promise<void>;
  notify: (type: 'success' | 'error' | 'warning', content: string) => void;
}

export default function AiOrganizePanel({ document, onOrganized, notify }: Props) {
  const { t } = useTranslation('translation');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const organize = async () => {
    if (document.items.length > AI_ORGANIZE_MAX_ITEMS) {
      const message = t('bookmark_graph_ai_error_item_limit', {
        count: AI_ORGANIZE_MAX_ITEMS,
      });
      setError(message);
      notify('warning', message);
      return;
    }
    if (!document.items.some((item) => item.type === 'bookmark')) {
      const message = t('bookmark_graph_ai_error_empty');
      setError(message);
      notify('warning', message);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.organizeBookmarksWithAi(
        documentToBookmarkOrganizeRequest(document, instruction)
      );
      await onOrganized(response);
      notify('success', t('bookmark_graph_ai_applied'));
    } catch (caught: any) {
      const messages: Record<number, string> = {
        400: t('bookmark_graph_ai_error_invalid'),
        401: t('bookmark_graph_ai_error_sign_in'),
        422: t('bookmark_graph_ai_error_unsafe'),
        429: t('bookmark_graph_ai_error_rate_limit'),
        502: t('bookmark_graph_ai_error_provider'),
        503: t('bookmark_graph_ai_error_unavailable'),
        504: t('bookmark_graph_ai_error_timeout'),
      };
      const message =
        messages[caught?.code] || caught?.message || t('bookmark_graph_ai_error_generate');
      setError(message);
      notify('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-theme-border p-4">
        <div className="mb-1 flex items-center gap-2 text-base font-semibold text-theme-foreground">
          <Sparkles size={18} className="text-theme-primary" /> {t('bookmark_graph_organize_ai')}
        </div>
        <p className="text-xs leading-5 text-theme-muted-foreground">
          {t('bookmark_graph_ai_privacy_note')}
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <label className="block text-xs font-medium text-theme-muted-foreground">
          {t('bookmark_graph_ai_instructions')}
          <Input.TextArea
            value={instruction}
            onChange={setInstruction}
            placeholder={t('bookmark_graph_ai_instructions_placeholder')}
            maxLength={1000}
            autoSize={{ minRows: 5, maxRows: 12 }}
            disabled={loading}
            className="mt-1"
          />
        </label>
        <Button
          type="primary"
          long
          loading={loading}
          disabled={loading}
          icon={<Sparkles size={15} />}
          onClick={organize}
          className="!flex items-center justify-center"
        >
          {t(loading ? 'bookmark_graph_ai_generating' : 'bookmark_graph_organize_ai')}
        </Button>
        {loading ? (
          <p className="text-center text-xs text-theme-muted-foreground">
            {t('bookmark_graph_ai_generation_hint')}
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-theme-border bg-theme-muted p-3 text-xs text-theme-foreground"
          >
            <AlertTriangle size={14} className="mt-0.5 flex-none" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
