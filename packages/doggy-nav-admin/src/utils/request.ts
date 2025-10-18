import { RequestConfig, request as umiRequest } from "@umijs/max";
import { message, notification } from "antd";
import { history } from "@umijs/max";

function defaultHeaders() {
  const headers: Record<string, string> = {}
  return headers
}

// const codeMessage = {
//   200: '服务器成功返回请求的数据。',
//   201: '新建或修改数据成功。',
//   202: '一个请求已经进入后台排队（异步任务）。',
//   204: '删除数据成功。',
//   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
//   401: '用户没有权限（令牌、用户名、密码错误）。',
//   403: '用户得到授权，但是访问是被禁止的。',
//   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
//   406: '请求的格式不可得。',
//   410: '请求的资源被永久删除，且不会再得到的。',
//   422: '当创建一个对象时，发生一个验证错误。',
//   500: '服务器发生错误，请检查服务器。',
//   502: '网关错误。',
//   503: '服务不可用，服务器暂时过载或维护。',
//   504: '网关超时。',
// };

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT'
  headers?: any
  data?: any
  body?: any
  msg?: string
  [rest: string]: any
}

function request(params: RequestOptions): any {
  let { url, method = 'GET', headers, data, body, msg } = params
  if (!headers) {
    headers = defaultHeaders()
  }
  if (method === 'GET' && data) {
    const cleaned: Record<string, any> = {};
    Object.keys(data).forEach((k) => {
      const v = (data as any)[k];
      if (v === undefined || v === null || v === '' || v === 'undefined') return;
      cleaned[k] = v;
    });
    const urlQueryParams = new URLSearchParams(cleaned as any)
    const qs = urlQueryParams.toString();
    if (qs) url = url + `?${qs}`
  }
  return new Promise((resolve, reject)=> {
    umiRequest(url, {
      method,
      headers,
      data,
      body
    }).then(res=> {
      if (msg) {
        message.success(msg)
      }
      resolve(res)
    }).catch(err=> {
      console.log(new Error(err))
      notification.error({message: err.toString()})
      reject(err)
    })
  })
}

export function requestConfigure(options= {}): RequestConfig {
  return {
    withCredentials: true,
    requestInterceptors: [
      (config) => {
        const url = (config as any)?.url || '';
        const isAbsolute = /^https?:\/\//i.test(url);
        const hasApiPrefix = url.startsWith('/api/');
        const finalUrl = isAbsolute || hasApiPrefix ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
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
    responseInterceptors: [
      (response) => {
        return response;
      },
    ],
    errorConfig: {
      errorHandler: (error: any) => {
        const { response } = error;
        const loginPath = '/user/login';

        if (!response) {
          notification.error({
            description: '您的网络发生异常，无法连接服务器',
            message: '网络异常',
          });
        } else if (response.status === 401) {
          // Handle 401 Unauthorized - redirect to login
          notification.error({
            description: '您的登录已过期，请重新登录',
            message: '登录过期',
          });
          history.push(loginPath);
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
  }
}

export default request
