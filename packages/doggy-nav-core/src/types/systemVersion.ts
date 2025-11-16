export interface SystemVersionInfo {
  currentCommitId: string | null;
  currentCommitTime: string | null;
  latestCommitId: string | null;
  latestCommitTime: string | null;
  hasNewVersion: boolean;
  checkedAt: string | null;
  error?: string;
}

export interface SystemVersionConfig {
  enabled?: boolean;
  repoSlug?: string | null;
  githubToken?: string | null;
  currentCommitId?: string | null;
  currentCommitTime?: string | null;
  timeoutMs?: number;
  // Execution environments (Node.js, Cloudflare Workers, etc.) can
  // provide their own fetch implementation if needed.
  fetchImpl?: (
    input: string,
    init?: any
  ) => Promise<{
    ok: boolean;
    status: number;
    json(): Promise<any>;
  }>;
}
