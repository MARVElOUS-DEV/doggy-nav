import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import '@ant-design/v5-patch-for-react-19';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { resolvePageTitle } from '../config/routes';
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
  const fetchUserInfo = async () => {
    const json = await apiRequest({ url: '/api/auth/me', method: 'GET' });
    const currentUser = json?.data?.user || undefined;
    if (typeof json?.data?.accessExp === 'number') {
      setAccessExpEpochMs(json.data.accessExp);
    }
    return currentUser;
  };

  try {
    const currentUser = await fetchUserInfo();
    return { settings: {}, currentUser, fetchUserInfo };
  } catch {
    return { settings: {}, fetchUserInfo };
  }
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    disableContentMargin: false,
    disableMobile: true,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    isChildrenLayout: false,
    menuHeaderRender: (logo) => logo,
    headerRender: () => {
      const pathname = history.location.pathname;
      const pageInfo = resolvePageTitle(pathname);

      return (
        <div className="admin-header-wrapper">
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
