import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import { notification } from 'antd';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import {getPersistenceData} from "@/utils/persistence";
import {CURRENT_USER, TOKEN} from "@/constants";

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
    const token = getPersistenceData(TOKEN)
    const user: any = getPersistenceData(CURRENT_USER)
    if (token) {
      return {
        name: JSON.parse(user)?.name,
        access: 'admin',
      }
    } else {
      history.push(loginPath);
    }
    return undefined;
  };

  if (history.location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: {},
    };
  }
  return {
    fetchUserInfo,
    settings: {},
  };
}

export const request: RequestConfig = {
  errorConfig: {
    errorHandler: (error: any) => {
      const { response } = error;
  
      if (!response) {
        notification.error({
          description: '您的网络发生异常，无法连接服务器',
          message: '网络异常',
        });
      }
      throw error;
    },
  }
};

