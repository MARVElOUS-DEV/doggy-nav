import { Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useApiEffect } from '@/hooks/useApi';
import api from '@/utils/api';
import type { SystemVersionInfo } from '@/types';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import InkBanner from '../InkBanner';

export default function AppFooter() {
  const { t } = useTranslation();
  const { data: systemVersion } = useApiEffect<SystemVersionInfo>(api.getSystemVersion, []);
  const { resolvedSiteSettings } = useSiteSettings();

  return (
    <footer className="glass-card mt-4 overflow-hidden rounded-xl border border-theme-border text-xs text-theme-muted-foreground shadow-sm">
      <InkBanner
        lines={[t('ink_banner_line_one'), t('ink_banner_line_two')]}
        brand={resolvedSiteSettings.siteTitle}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-theme-primary">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            <span>Server</span>
          </span>
          <Tooltip
            content={
              systemVersion?.currentCommitId
                ? `${systemVersion.currentCommitId}${
                    systemVersion.currentCommitTime
                      ? ` @ ${new Date(systemVersion.currentCommitTime).toLocaleString()}`
                      : ''
                  }`
                : 'Unknown commit'
            }
            position="top"
          >
            <span className="inline-flex items-center font-mono bg-theme-muted px-2 py-0.5 rounded-full cursor-default max-w-[140px] truncate">
              {systemVersion?.currentCommitId
                ? systemVersion.currentCommitId.slice(0, 7)
                : 'unknown'}
            </span>
          </Tooltip>
          {systemVersion?.checkedAt && (
            <span className="hidden sm:inline opacity-70">
              Checked at {new Date(systemVersion.checkedAt).toLocaleTimeString()}
            </span>
          )}
          {resolvedSiteSettings.copyrightText ? (
            <span className="opacity-80">{resolvedSiteSettings.copyrightText}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          {systemVersion?.hasNewVersion && systemVersion.latestCommitId ? (
            <span className="inline-flex items-center gap-2 text-warning">
              <span className="inline-block w-2 h-2 rounded-full bg-warning" />
              <span>
                New version {systemVersion.latestCommitId.slice(0, 7)} available
                {systemVersion.latestCommitTime
                  ? ` · ${new Date(systemVersion.latestCommitTime).toLocaleString()}`
                  : ''}
              </span>
            </span>
          ) : systemVersion?.error ? (
            <span className="opacity-80">Version check unavailable ({systemVersion.error})</span>
          ) : (
            <span className="opacity-80">You are running the latest backend version.</span>
          )}
        </div>
      </div>
    </footer>
  );
}
