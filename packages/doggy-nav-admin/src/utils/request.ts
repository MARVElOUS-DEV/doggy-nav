import { history, RequestConfig, request as umiRequest } from '@umijs/max';
import { message, notification } from 'antd';

function defaultHeaders() {
  const headers: Record<string, string> = { 'X-App-Source': 'admin' };
  return headers;
}

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT';
  headers?: any;
  data?: any;
  body?: any;
  msg?: string;
  [rest: string]: any;
}

function request(params: RequestOptions): any {
  let { url, method = 'GET', headers, data, body, msg } = params;
  if (!headers) {
    headers = defaultHeaders();
  }
  if (method === 'GET' && data) {
    const cleaned: Record<string, any> = {};
    Object.keys(data).forEach((k) => {
      const v = (data as any)[k];
      if (v === undefined || v === null || v === '' || v === 'undefined')
        return;
      cleaned[k] = v;
    });
    const urlQueryParams = new URLSearchParams(cleaned as any);
    const qs = urlQueryParams.toString();
    if (qs) url = url + `?${qs}`;
  }
  return new Promise((resolve, reject) => {
    umiRequest(url, {
      method,
      headers,
      data,
      body,
    })
      .then((res) => {
        if (msg) {
          message.success(msg);
        }
        resolve(res);
      })
      .catch((err) => {
        console.log(new Error(err));
        notification.error({ message: err.toString() });
        reject(err);
      });
  });
}

export function requestConfigure(options = {}): RequestConfig {
  // Single-flight refresh guard shared across all requests
  let refreshPromise: Promise<any> | null = null;
  const isRefreshUrl = (url: string) => /\/api\/auth\/refresh\b/.test(url);
  const doRefresh = () =>
    umiRequest('/api/auth/refresh', { method: 'POST', withCredentials: true });

  return {
    withCredentials: true,
    requestInterceptors: [
      (config) => {
        const url = (config as any)?.url || '';
        const isAbsolute = /^https?:\/\//i.test(url);
        const hasApiPrefix = url.startsWith('/api/');
        const finalUrl =
          isAbsolute || hasApiPrefix
            ? url
            : `/api${url.startsWith('/') ? '' : '/'}${url}`;
        // Preserve resolved URL for reliable retries in error handler
        config.__finalUrl = finalUrl;
        return {
          ...config,
          url: finalUrl,
          headers: {
            ...config.headers,
            ...defaultHeaders(),
          },
        };
      },
    ],
    responseInterceptors: [async (response) => response],
    errorConfig: {
      errorHandler: async (error: any) => {
        const { response, request: eRequest, config } = error;
        const loginPath = '/user/login';

        if (!response) {
          notification.error({
            description: '您的网络发生异常，无法连接服务器',
            message: '网络异常',
          });
        } else if (response.status === 401) {
          const cfg = { ...(config || {}) };
          const failingUrl: string =
            cfg.__finalUrl || eRequest?.responseURL || cfg.url || '';
          if (typeof failingUrl === 'string' && isRefreshUrl(failingUrl)) {
            // refresh itself failed -> proceed to logout/redirect
          } else if (cfg.__isRetryRequest) {
            // already retried once, stop here
          } else {
            try {
              if (!refreshPromise) {
                refreshPromise = doRefresh().finally(() => {
                  refreshPromise = null;
                });
              }
              await refreshPromise;
              const resolvedUrl: string =
                cfg.__finalUrl || eRequest?.responseURL || cfg.url || '';
              if (typeof resolvedUrl === 'string' && resolvedUrl.length > 1) {
                return await umiRequest(resolvedUrl, {
                  ...cfg,
                  __isRetryRequest: true,
                });
              }
            } catch (e) {
              console.error('silent refresh failed:', e);
            }
          }
          if (location.pathname !== loginPath) {
            history.push(loginPath);
          }
          return;
        } else if (response.status >= 500) {
          notification.error({
            description: '服务器发生错误，请稍后重试',
            message: '服务器错误',
          });
        } else if (response.status === 403) {
          notification.error({
            description: '您没有权限访问此资源',
            message: '权限不足',
          });
        } else if (response.status === 404) {
          notification.error({
            description: '请求的资源不存在',
            message: '资源不存在',
          });
        }
        throw error;
      },
    },
    ...options,
  };
}

export default request;
