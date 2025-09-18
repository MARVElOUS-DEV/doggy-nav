import { PageLoading } from '@ant-design/pro-layout';
import RightContent from '@/components/RightContent';
import type { RuntimeConfig } from '@umijs/max';
import Footer from '@/components/Footer';
import { getPersistenceData } from "@/utils/persistence";
import { TOKEN } from "@/constants";
import { history } from '@umijs/max';

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};
const loginPath = '/user/login';
// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RuntimeConfig = ({ initialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      const token = getPersistenceData(TOKEN)
      if (!token && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
  };
};
