import type { ChangeEvent, ReactNode } from 'react';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Message } from '@arco-design/web-react';
import { ArrowLeftRight, Copy, Download, LoaderCircle, RefreshCw, Upload } from 'lucide-react';
import { parse as parseYaml } from 'yaml';
import { convertJsonToFormattedYaml, convertYamlToFormattedJson } from './converter';
import api from '@/utils/api';
import type { ToolOutputDirection, ToolOutputPublication } from '@/types';

const sampleJson = `{
  "12312": "asdasd",
  "test": "publish",
  "timestamp": "2026-04-11T02:30:00Z",
  "a": 123123123,
  "a333": "adasdsad12323123",
  "kjkksd": [1, 2, 3, 4, 5],
  "kjkj": [
    {
      "a": 333
    }
  ]
}`;

const sampleYaml = convertJsonToFormattedYaml(sampleJson);

type EditorKind = 'json' | 'yaml';

type LatestRecord = {
  content: string;
  contentType: string;
  fetchedAt: string;
};

type PublishedEndpointHintState = {
  url: string;
  passwordIncluded: boolean;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function encodeBasicAuth(username: string, password: string) {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${window.btoa(binary)}`;
}

function formatTimestamp(value?: string) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildPublishedEndpointUrl(publishId: string) {
  if (!publishId || typeof window === 'undefined') return '';
  return `${window.location.origin}/api/tool-outputs/converter/published/${publishId}`;
}

function buildAuthenticatedEndpointUrl(baseUrl: string, username: string, password: string) {
  if (!baseUrl) return '';

  try {
    const url = new URL(baseUrl);
    url.username = username;
    if (password) {
      url.password = password;
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function getFormatFromPublication(publication: ToolOutputPublication | null): EditorKind {
  if (publication?.contentType?.includes('yaml')) return 'yaml';
  if (publication?.contentType?.includes('json')) return 'json';
  return publication?.direction === 'json-to-yaml' ? 'yaml' : 'json';
}

function inferContentFormat(content: string, contentType?: string): EditorKind | null {
  if (contentType?.includes('yaml')) return 'yaml';
  if (contentType?.includes('json')) return 'json';

  try {
    JSON.parse(content);
    return 'json';
  } catch {}

  try {
    parseYaml(content);
    return 'yaml';
  } catch {}

  return null;
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'valid' | 'invalid' | 'neutral';
  children: ReactNode;
}) {
  const colors =
    tone === 'valid'
      ? {
          border: 'rgba(34, 197, 94, 0.28)',
          background: 'rgba(22, 101, 52, 0.24)',
          color: '#72f1a0',
        }
      : tone === 'invalid'
        ? {
            border: 'rgba(248, 113, 113, 0.28)',
            background: 'rgba(127, 29, 29, 0.24)',
            color: '#fca5a5',
          }
        : {
            border: 'rgba(148, 163, 184, 0.18)',
            background: 'rgba(71, 85, 105, 0.18)',
            color: '#cbd5e1',
          };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.background,
        color: colors.color,
      }}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.color }} />
      {children}
    </span>
  );
}

function HeaderToggle({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all',
        active ? 'shadow-[0_10px_30px_rgba(139,92,246,0.18)]' : ''
      )}
      style={{
        color: active ? '#f8fafc' : 'rgba(226, 232, 240, 0.58)',
        backgroundColor: active ? 'rgba(124, 58, 237, 0.28)' : 'transparent',
      }}
    >
      {children}
    </button>
  );
}

function IconActionButton({
  title,
  disabled,
  onClick,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border p-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        borderColor: 'rgba(148, 163, 184, 0.14)',
        color: '#b8bed5',
      }}
      title={title}
      aria-label={title}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

function EditorPane({
  label,
  placeholder,
  value,
  status,
  message,
  compact = false,
  onChange,
  onCopy,
}: {
  label: string;
  placeholder: string;
  value: string;
  status: 'valid' | 'invalid' | 'neutral';
  message?: string;
  compact?: boolean;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onCopy: () => void;
}) {
  return (
    <section
      className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', compact ? 'min-h-[156px]' : '')}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b',
          compact ? 'px-4 py-2.5' : 'px-4 py-4'
        )}
        style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#e2e8f0]/72">
            {label}
          </span>
          <StatusBadge tone={status}>
            {status === 'valid' ? 'Valid' : status === 'invalid' ? 'Invalid' : 'Ready'}
          </StatusBadge>
        </div>
        <IconActionButton disabled={!value.trim()} onClick={onCopy} title={`Copy ${label}`} />
      </div>

      <textarea
        spellCheck={false}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'min-h-0 flex-1 resize-none border-0 bg-transparent font-mono text-[#e5e7eb] outline-none placeholder:text-[#64748b]',
          compact ? 'px-4 py-2.5 text-sm leading-6' : 'px-4 py-4 text-[15px] leading-7'
        )}
      />

      <div
        className={cn('border-t px-4 text-xs', compact ? 'min-h-[24px] py-1' : 'min-h-[32px] py-2')}
        style={{
          borderColor: 'rgba(148, 163, 184, 0.1)',
          color: status === 'invalid' ? '#fca5a5' : 'rgba(226, 232, 240, 0.56)',
        }}
      >
        {message ||
          (status === 'valid'
            ? 'Parsed successfully.'
            : 'Edit either side and the opposite pane stays in sync.')}
      </div>
    </section>
  );
}

function ControlField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'password';
}) {
  return (
    <label className="flex min-w-[180px] flex-1 flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2e8f0]/44">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border bg-black/25 px-4 text-sm text-[#f8fafc] outline-none placeholder:text-[#64748b]"
        style={{ borderColor: 'rgba(148, 163, 184, 0.14)' }}
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'ghost',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'ghost' | 'solid';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition',
        tone === 'solid' ? 'shadow-[0_14px_34px_rgba(255,255,255,0.12)]' : ''
      )}
      style={{
        borderColor: tone === 'solid' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(148, 163, 184, 0.14)',
        backgroundColor: tone === 'solid' ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
        color: tone === 'solid' ? '#0f172a' : '#e2e8f0',
      }}
    >
      {children}
    </button>
  );
}

function PublishedEndpointHint({
  endpointUrl,
  passwordIncluded,
  onCopy,
}: {
  endpointUrl: string;
  passwordIncluded: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      className="flex w-full items-center gap-2 rounded-xl border px-3 py-2"
      style={{
        borderColor: 'rgba(148, 163, 184, 0.14)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e2e8f0]/42">
          Published Endpoint
        </div>
        <div className="truncate text-xs text-[#cbd5e1]" title={endpointUrl}>
          {endpointUrl}
        </div>
        {!passwordIncluded ? (
          <div className="mt-1 text-[11px] text-[#fbbf24]">
            Password hidden. Enter it manually in the URL if needed.
          </div>
        ) : null}
      </div>
      <IconActionButton title="Copy published endpoint" onClick={onCopy} />
    </div>
  );
}

export default function YamlJsonConverterApp() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endpointHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [publishFormat, setPublishFormat] = useState<EditorKind>('json');
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [yamlInput, setYamlInput] = useState(sampleYaml);
  const [activeEditor, setActiveEditor] = useState<EditorKind>('json');
  const [jsonError, setJsonError] = useState('');
  const [yamlError, setYamlError] = useState('');
  const [publication, setPublication] = useState<ToolOutputPublication | null>(null);
  const [publicationLoaded, setPublicationLoaded] = useState(false);
  const [basicAuthUsername, setBasicAuthUsername] = useState('');
  const [basicAuthPassword, setBasicAuthPassword] = useState('');
  const [savingPublication, setSavingPublication] = useState(false);
  const [deletingPublication, setDeletingPublication] = useState(false);
  const [fetchingLatest, setFetchingLatest] = useState(false);
  const [latestRecord, setLatestRecord] = useState<LatestRecord | null>(null);
  const [containerWidth, setContainerWidth] = useState(1160);
  const [showPublishedEndpoint, setShowPublishedEndpoint] = useState(false);
  const [publishedEndpointHint, setPublishedEndpointHint] =
    useState<PublishedEndpointHintState | null>(null);

  const jsonStatus = jsonInput.trim() ? (jsonError ? 'invalid' : 'valid') : 'neutral';
  const yamlStatus = yamlInput.trim() ? (yamlError ? 'invalid' : 'valid') : 'neutral';
  const currentError = activeEditor === 'json' ? jsonError : yamlError;
  const selectedOutput = publishFormat === 'json' ? jsonInput : yamlInput;
  const selectedDirection: ToolOutputDirection =
    publishFormat === 'json' ? 'yaml-to-json' : 'json-to-yaml';
  const contentType = 'text/plain; charset=utf-8';
  const endpointUrl = useMemo(() => {
    return buildPublishedEndpointUrl(publication?.publishId || '');
  }, [publication?.publishId]);
  const recordMeta = useMemo(() => {
    if (!publication) {
      return publicationLoaded ? 'No publication saved yet.' : 'Loading publication settings...';
    }

    const stamp = formatTimestamp(publication.updatedAt || publication.createdAt);
    const actor = publication.basicAuthUsername || 'unknown';
    return `Latest published record ${stamp || 'recently'} by ${actor}`;
  }, [publication, publicationLoaded]);
  const canPublish =
    !currentError &&
    !!jsonInput.trim() &&
    !!yamlInput.trim() &&
    !!basicAuthUsername.trim() &&
    (!!publication?.hasPassword || !!basicAuthPassword.trim());
  const stackedEditors = containerWidth < 980;
  const compactControls = containerWidth < 1040;
  const stackedFieldRow = containerWidth < 760;
  const stackedActions = containerWidth < 640;

  const revealPublishedEndpoint = (hint: PublishedEndpointHintState) => {
    setPublishedEndpointHint(hint);
    setShowPublishedEndpoint(true);
    if (endpointHintTimerRef.current) {
      clearTimeout(endpointHintTimerRef.current);
    }
    endpointHintTimerRef.current = setTimeout(() => {
      setShowPublishedEndpoint(false);
      endpointHintTimerRef.current = null;
    }, 10000);
  };

  const applyJsonDraft = (nextJson: string) => {
    setActiveEditor('json');
    setJsonInput(nextJson);

    if (!nextJson.trim()) {
      setJsonError('');
      setYamlError('');
      startTransition(() => setYamlInput(''));
      return;
    }

    try {
      const nextYaml = convertJsonToFormattedYaml(nextJson);
      setJsonError('');
      setYamlError('');
      startTransition(() => setYamlInput(nextYaml));
    } catch (error) {
      setJsonError(getErrorMessage(error, 'Unable to parse JSON.'));
    }
  };

  const applyYamlDraft = (nextYaml: string) => {
    setActiveEditor('yaml');
    setYamlInput(nextYaml);

    if (!nextYaml.trim()) {
      setJsonError('');
      setYamlError('');
      startTransition(() => setJsonInput(''));
      return;
    }

    try {
      const nextJson = convertYamlToFormattedJson(nextYaml);
      setJsonError('');
      setYamlError('');
      startTransition(() => setJsonInput(nextJson));
    } catch (error) {
      setYamlError(getErrorMessage(error, 'Unable to parse YAML.'));
    }
  };

  const copyText = async (value: string, successMessage: string) => {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      Message.success(successMessage);
    } catch {
      Message.error('Copy failed');
    }
  };

  const loadLatestIntoEditor = () => {
    if (!latestRecord?.content) {
      Message.error('Fetch the latest publication first.');
      return;
    }

    const format = inferContentFormat(latestRecord.content, latestRecord.contentType);
    if (format === 'yaml') {
      setPublishFormat('yaml');
      applyYamlDraft(latestRecord.content);
      Message.success('Loaded published YAML into the editor');
      return;
    }
    if (format === 'json') {
      setPublishFormat('json');
      applyJsonDraft(latestRecord.content);
      Message.success('Loaded published JSON into the editor');
      return;
    }

    Message.error('Unable to detect the published format.');
  };

  const fetchLatestPublished = async () => {
    if (!endpointUrl) {
      Message.error('Publish the config first to create an endpoint.');
      return;
    }
    if (!basicAuthUsername.trim()) {
      Message.error('Basic Auth username is required.');
      return;
    }
    if (!basicAuthPassword.trim()) {
      Message.error('Enter the Basic Auth password to fetch the published output.');
      return;
    }

    setFetchingLatest(true);
    try {
      const response = await fetch(endpointUrl, {
        headers: {
          Authorization: encodeBasicAuth(basicAuthUsername.trim(), basicAuthPassword),
        },
      });
      const content = await response.text();

      if (!response.ok) {
        throw new Error(content || 'Unable to fetch the published output.');
      }

      setLatestRecord({
        content,
        contentType: response.headers.get('content-type') || publication?.contentType || '',
        fetchedAt: new Date().toISOString(),
      });
      Message.success('Fetched the latest publication');
    } catch (error) {
      Message.error(getErrorMessage(error, 'Unable to fetch the published output.'));
    } finally {
      setFetchingLatest(false);
    }
  };

  const handleSavePublication = async () => {
    if (!canPublish) {
      if (currentError) {
        Message.error('Fix the invalid editor content before publishing.');
        return;
      }
      if (!basicAuthUsername.trim()) {
        Message.error('Basic Auth username is required.');
        return;
      }
      if (!publication?.hasPassword && !basicAuthPassword.trim()) {
        Message.error('Basic Auth password is required.');
        return;
      }
      Message.error('Both JSON and YAML need content before publishing.');
      return;
    }

    setSavingPublication(true);
    try {
      const saved = await api.saveToolOutputPublication({
        enabled: true,
        direction: selectedDirection,
        contentType,
        output: selectedOutput,
        basicAuthUsername: basicAuthUsername.trim(),
        basicAuthPassword: basicAuthPassword.trim() || undefined,
      });

      setPublication(saved);
      setPublishFormat(getFormatFromPublication(saved));
      setBasicAuthUsername(saved.basicAuthUsername || '');
      setLatestRecord({
        content: selectedOutput,
        contentType,
        fetchedAt: new Date().toISOString(),
      });
      revealPublishedEndpoint({
        url: buildAuthenticatedEndpointUrl(
          buildPublishedEndpointUrl(saved.publishId),
          basicAuthUsername.trim(),
          basicAuthPassword.trim()
        ),
        passwordIncluded: basicAuthPassword.trim().length > 0,
      });
      Message.success(publishFormat === 'json' ? 'Published JSON saved' : 'Published YAML saved');
    } finally {
      setSavingPublication(false);
    }
  };

  const handleDeletePublication = async () => {
    setDeletingPublication(true);
    try {
      await api.deleteToolOutputPublication();
      setPublication(null);
      setLatestRecord(null);
      setPublishedEndpointHint(null);
      setShowPublishedEndpoint(false);
      if (endpointHintTimerRef.current) {
        clearTimeout(endpointHintTimerRef.current);
        endpointHintTimerRef.current = null;
      }
      Message.success('Published output deleted');
    } finally {
      setDeletingPublication(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadPublication = async () => {
      try {
        const current = await api.getToolOutputPublication();
        if (!active) return;

        setPublication(current);
        setPublishFormat(getFormatFromPublication(current));
        setBasicAuthUsername(current?.basicAuthUsername || '');
      } catch {
      } finally {
        if (active) setPublicationLoaded(true);
      }
    };

    loadPublication();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      const nextWidth = Math.round(element.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (endpointHintTimerRef.current) {
        clearTimeout(endpointHintTimerRef.current);
      }
    };
  }, []);

  const latestRecordBody =
    latestRecord?.content ||
    (publication
      ? 'Use Fetch Latest to preview the currently published payload here.'
      : 'Publish a JSON or YAML record to show the latest stored payload here.');

  return (
    <div
      ref={containerRef}
      className="flex min-h-full flex-col overflow-hidden rounded-[22px]"
      style={{
        color: '#f8fafc',
        background:
          'radial-gradient(circle at top left, rgba(112, 38, 191, 0.34), transparent 34%), linear-gradient(180deg, #221327 0%, #120814 52%, #0d0712 100%)',
      }}
    >
      <header className="border-b px-5 py-4" style={{ borderColor: 'rgba(148, 163, 184, 0.12)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[#c4b5fd]">
            <ArrowLeftRight className="h-4 w-4" />
            <div>
              <h2 className="text-lg font-semibold text-[#f8fafc]">Config Exchange</h2>
              <p className="text-xs uppercase tracking-[0.28em] text-[#e2e8f0]/36">
                Live JSON / YAML synchronization
              </p>
            </div>
          </div>

          <div
            className="inline-flex items-center rounded-full border p-1"
            style={{
              borderColor: 'rgba(148, 163, 184, 0.14)',
              backgroundColor: 'rgba(15, 23, 42, 0.36)',
            }}
          >
            <HeaderToggle
              active={publishFormat === 'json'}
              onClick={() => setPublishFormat('json')}
            >
              JSON
            </HeaderToggle>
            <HeaderToggle
              active={publishFormat === 'yaml'}
              onClick={() => setPublishFormat('yaml')}
            >
              YAML
            </HeaderToggle>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            'grid',
            stackedEditors
              ? 'flex-none auto-rows-[minmax(156px,auto)]'
              : 'min-h-0 flex-1 grid-cols-[1fr_auto_1fr]'
          )}
        >
          <EditorPane
            label="JSON"
            placeholder={sampleJson}
            value={jsonInput}
            status={jsonStatus}
            message={jsonError}
            compact={stackedEditors}
            onChange={(event) => applyJsonDraft(event.target.value)}
            onCopy={() => copyText(jsonInput, 'JSON copied')}
          />

          <div
            className={cn(stackedEditors ? 'h-px w-full' : 'w-px')}
            style={{
              background: stackedEditors
                ? 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.18), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.18), transparent)',
            }}
          />

          <EditorPane
            label="YAML"
            placeholder={sampleYaml}
            value={yamlInput}
            status={yamlStatus}
            message={yamlError}
            compact={stackedEditors}
            onChange={(event) => applyYamlDraft(event.target.value)}
            onCopy={() => copyText(yamlInput, 'YAML copied')}
          />
        </div>

        <section
          className="border-t px-5 py-5"
          style={{
            borderColor: 'rgba(148, 163, 184, 0.12)',
            background: 'linear-gradient(180deg, rgba(10, 8, 15, 0.72), rgba(8, 6, 14, 0.96))',
          }}
        >
          <div className="flex flex-col gap-5">
            {compactControls ? (
              <div className="flex flex-col gap-3">
                <div
                  className={cn(
                    'grid gap-4',
                    stackedFieldRow
                      ? 'grid-cols-1'
                      : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end'
                  )}
                >
                  <ControlField
                    label="Username"
                    value={basicAuthUsername}
                    onChange={setBasicAuthUsername}
                    placeholder="admin"
                  />
                  <ControlField
                    label="Password"
                    type="password"
                    value={basicAuthPassword}
                    onChange={setBasicAuthPassword}
                    placeholder={
                      publication?.hasPassword ? 'Enter current password' : 'Minimum 8 characters'
                    }
                  />
                  <div className="flex">
                    <ActionButton
                      tone="solid"
                      disabled={savingPublication || !canPublish}
                      onClick={handleSavePublication}
                    >
                      {savingPublication ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Publish
                    </ActionButton>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex gap-3',
                    stackedActions ? 'flex-col' : 'flex-wrap items-center'
                  )}
                >
                  <ActionButton
                    disabled={
                      fetchingLatest ||
                      !endpointUrl ||
                      !publication?.enabled ||
                      !basicAuthUsername.trim()
                    }
                    onClick={fetchLatestPublished}
                  >
                    {fetchingLatest ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Fetch Latest
                  </ActionButton>
                  <ActionButton disabled={!latestRecord?.content} onClick={loadLatestIntoEditor}>
                    <Download className="h-4 w-4" />
                    Load into Editor
                  </ActionButton>
                  <ActionButton
                    disabled={!publication || deletingPublication}
                    onClick={handleDeletePublication}
                  >
                    {deletingPublication ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    Delete Stored
                  </ActionButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex flex-1 gap-4">
                    <ControlField
                      label="Username"
                      value={basicAuthUsername}
                      onChange={setBasicAuthUsername}
                      placeholder="admin"
                    />
                    <ControlField
                      label="Password"
                      type="password"
                      value={basicAuthPassword}
                      onChange={setBasicAuthPassword}
                      placeholder={
                        publication?.hasPassword ? 'Enter current password' : 'Minimum 8 characters'
                      }
                    />
                    <div className="flex items-end">
                      <ActionButton
                        tone="solid"
                        disabled={savingPublication || !canPublish}
                        onClick={handleSavePublication}
                      >
                        {savingPublication ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Publish
                      </ActionButton>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <ActionButton
                      disabled={
                        fetchingLatest ||
                        !endpointUrl ||
                        !publication?.enabled ||
                        !basicAuthUsername.trim()
                      }
                      onClick={fetchLatestPublished}
                    >
                      {fetchingLatest ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Fetch Latest
                    </ActionButton>
                    <ActionButton disabled={!latestRecord?.content} onClick={loadLatestIntoEditor}>
                      <Download className="h-4 w-4" />
                      Load into Editor
                    </ActionButton>
                    <ActionButton
                      disabled={!publication || deletingPublication}
                      onClick={handleDeletePublication}
                    >
                      {deletingPublication ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                      Delete Stored
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {showPublishedEndpoint && publishedEndpointHint?.url ? (
                <PublishedEndpointHint
                  endpointUrl={publishedEndpointHint.url}
                  passwordIncluded={publishedEndpointHint.passwordIncluded}
                  onCopy={() => copyText(publishedEndpointHint.url, 'Endpoint URL copied')}
                />
              ) : null}

              <div
                className="rounded-xl border px-3 py-2 text-xs leading-6"
                style={{
                  borderColor: 'rgba(250, 204, 21, 0.18)',
                  backgroundColor: 'rgba(120, 53, 15, 0.16)',
                  color: '#fcd34d',
                }}
              >
                When you publish data, it is stored on our platform in encrypted form. Use at your
                own risk.
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2e8f0]/38">
                <span>Latest Published Record</span>
                <span className="text-[#94a3b8]">{recordMeta}</span>
                {latestRecord?.fetchedAt ? (
                  <span className="text-[#64748b]">
                    fetched {formatTimestamp(latestRecord.fetchedAt)}
                  </span>
                ) : null}
              </div>
              <div
                className="mt-3 overflow-hidden rounded-2xl border"
                style={{
                  borderColor: 'rgba(148, 163, 184, 0.12)',
                  background:
                    'linear-gradient(180deg, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.28))',
                }}
              >
                <pre className="max-h-[148px] overflow-auto px-4 py-4 font-mono text-sm leading-7 text-[#cbd5e1]">
                  <code>{latestRecordBody}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
