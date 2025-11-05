import type { UrlHeadClient } from 'doggy-nav-core';
import axios from 'axios';

export class AxiosUrlHeadClient implements UrlHeadClient {
  async head(url: string, options?: { timeoutMs?: number; headers?: Record<string, string> }): Promise<{ ok: boolean; status?: number }>
  {
    try {
      const res = await axios.head(url, { timeout: options?.timeoutMs ?? 5000, headers: options?.headers });
      return { ok: res.status >= 200 && res.status < 400, status: res.status };
    } catch (e: any) {
      const status = e?.response?.status;
      return { ok: false, status };
    }
  }
}

export default AxiosUrlHeadClient;
