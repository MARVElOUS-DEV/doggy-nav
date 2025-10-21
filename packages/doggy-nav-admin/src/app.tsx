import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import ContentHeader from './components/ContentHeader';
import apiRequest, { requestConfigure } from './utils/request';
import {
  setAccessExpEpochMs,
  startProactiveAuthRefresh,
} from './utils/session';

const loginPath = '/user/login';
// const isDev = process.env.NODE_ENV === 'development';
/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  // Fetch current user info (roles included) to drive access control
  try {
    const json = await apiRequest({ url: '/api/auth/me', method: 'GET' });
    const currentUser = json?.data?.user || undefined;
    if (typeof json?.data?.accessExp === 'number')
      setAccessExpEpochMs(json.data.accessExp);
    const fetchUserInfo = async () => currentUser;
    return { settings: {}, currentUser, fetchUserInfo };
  } catch {
    return { settings: {} };
  }
}

// 页面标题和子标题映射
const pageTitles: Record<
  string,
  {
    title: string;
    subtitle: string;
    showUserMenu?: boolean;
    showSearch?: boolean;
    actions?: React.ReactNode[];
  }
> = {
  '/nav/admin': {
    title: '仪表盘',
    subtitle: '系统概览',
    showUserMenu: true,
    showSearch: false,
  },
  '/nav/list': {
    title: '导航列表',
    subtitle: '管理网站导航链接',
    showUserMenu: true,
    showSearch: false,
  },
  '/nav/category': {
    title: '分类管理',
    subtitle: '管理网站分类',
    showUserMenu: true,
    showSearch: false,
  },
  '/nav/tag': {
    title: '标签管理',
    subtitle: '管理网站标签',
    showUserMenu: true,
    showSearch: false,
  },
  '/nav/audit': {
    title: '审核管理',
    subtitle: '审核网站提交',
    showUserMenu: true,
    showSearch: false,
  },
  '/group/manage': {
    title: '分组管理',
    subtitle: '管理用户分组',
    showUserMenu: true,
    showSearch: false,
  },
};

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  //expose a global helper to refresh currentUser so access() re-evaluates without full reload
  (window as any).g_updateInitialState = async () => {
    try {
      const json = await apiRequest({ url: '/api/auth/me', method: 'GET' });
      const currentUser = json?.data?.user || undefined;
      await setInitialState((s: any) => ({ ...s, currentUser }));
    } catch {
      await setInitialState((s: any) => ({ ...s, currentUser: undefined }));
    }
  };
  return {
    disableContentMargin: false,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    isChildrenLayout: false,
    menuHeaderRender: (logo) => logo,
    headerRender: () => {
      const pathname = history.location.pathname;
      const pageInfo = pageTitles[pathname] || {
        title: '页面',
        subtitle: '页面管理',
        showUserMenu: true,
        showSearch: false,
        actions: [],
      };

      return (
        <div
          style={{
            overflow: 'hidden',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {pathname !== loginPath && pathname !== '/404' && (
            <ContentHeader
              title={pageInfo.title}
              subtitle={pageInfo.subtitle}
              showUserMenu={pageInfo.showUserMenu}
              showSearch={pageInfo.showSearch}
              actions={pageInfo.actions}
              currentUser={initialState?.currentUser}
            />
          )}
        </div>
      );
    },
    layout: 'mix',
    // 自定义 403 页面
    unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
  };
};
export const request: RequestConfig = requestConfigure();

// kick off proactive refresh once runtime starts
if (typeof window !== 'undefined') {
  startProactiveAuthRefresh();
}
