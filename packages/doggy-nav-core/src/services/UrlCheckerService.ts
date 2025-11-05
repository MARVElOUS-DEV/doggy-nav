export interface UrlHeadClient {
  head(url: string, options?: { timeoutMs?: number; headers?: Record<string, string> }): Promise<{ ok: boolean; status?: number }>;
}

export type UrlCheckResult = { status: 'accessible' | 'inaccessible'; responseTime: number; error?: string };

export class UrlCheckerService {
  constructor(private readonly client: UrlHeadClient) {}

  async check(url: string, options?: { timeoutMs?: number; headers?: Record<string, string> }): Promise<UrlCheckResult> {
    const start = Date.now();
    try {
      const res = await this.client.head(url, options);
      const ms = Date.now() - start;
      if (res.ok) return { status: 'accessible', responseTime: ms };
      return { status: 'inaccessible', responseTime: ms, error: res.status ? `HTTP ${res.status}` : 'Unknown' };
    } catch (e: any) {
      const ms = Date.now() - start;
      return { status: 'inaccessible', responseTime: ms, error: e?.message || 'Network error' };
    }
  }
}

export default UrlCheckerService;
