import { PageLoading } from '@ant-design/pro-layout';
import RightContent from '@/components/RightContent';
import type { RuntimeConfig } from '@umijs/max';
import Footer from '@/components/Footer';
import ContentHeader from '@/components/ContentHeader';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getPersistenceData } from "@/utils/persistence";
import { TOKEN } from "@/constants";
import { history } from '@umijs/max';
import React from 'react';

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};
const loginPath = '/user/login';

// 页面标题和子标题映射
const pageTitles: Record<string, { title: string; subtitle: string; showUserMenu?: boolean; showSearch?: boolean; actions?: React.ReactNode[] }> = {
  '/': { title: '仪表盘', subtitle: '系统概览', showUserMenu: true, showSearch: false },
  '/nav/list': {
    title: '导航列表',
    subtitle: '管理网站导航链接',
    showUserMenu: false,
    showSearch: true,
    actions: [
      <Button
        key="add-nav"
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          // 这里需要触发 NavList 的表单显示
          // 我们可以监听全局事件或者使用状态管理
          console.log('添加导航按钮点击');
        }}
      >
        添加导航
      </Button>
    ]
  },
  '/nav/category': { title: '分类管理', subtitle: '管理网站分类', showUserMenu: false, showSearch: true },
  '/nav/tag': { title: '标签管理', subtitle: '管理网站标签', showUserMenu: false, showSearch: true },
  '/nav/audit': { title: '审核管理', subtitle: '审核网站提交', showUserMenu: false, showSearch: true },
};

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
    childrenRender: (children) => {
      const pathname = history.location.pathname;
      console.log("🚀 ~ layout ~ pathname:", pathname)
      const pageInfo = pageTitles[pathname] || {
        title: '页面',
        subtitle: '页面管理',
        showUserMenu: true,
        showSearch: true,
        actions: []
      };

      return (
        <div style={{
          padding: '0 24px',
          overflow: 'hidden',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {pathname !== loginPath && pathname !== '/404' && (
            <ContentHeader
              title={pageInfo.title}
              subtitle={pageInfo.subtitle}
              showUserMenu={pageInfo.showUserMenu}
              showSearch={pageInfo.showSearch}
              actions={pageInfo.actions}
            />
          )}
          {children}
        </div>
      );
    },
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
  };
};
