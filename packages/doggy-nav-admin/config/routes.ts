export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user',
        routes: [
          { name: '登录', path: '/user/login', component: './user/Login' },
        ],
      },
    ],
  },
  { name: '首页', icon: 'home', path: '/nav/admin', component: './Admin' },
  {
    name: '审核管理',
    icon: 'audit',
    path: '/nav/audit',
    component: './nav/Audit',
  },
  {
    name: '导航列表',
    icon: 'send',
    path: '/nav/list',
    component: './nav/List',
  },
  {
    name: '书签导入',
    icon: 'upload',
    path: '/nav/bookmarks',
    component: './nav/Bookmarks',
  },
  {
    name: '分类列表',
    icon: 'book',
    path: '/nav/category',
    component: './nav/Category',
  },
  { name: '标签列表', icon: 'tag', path: '/nav/tag', component: './nav/Tag' },
  {
    name: '用户管理',
    icon: 'user',
    path: '/user/manage',
    component: './user',
    access: 'isSysadmin',
  },
  {
    name: '分组管理',
    icon: 'team',
    path: '/group/manage',
    component: './group',
    access: 'isSysadmin',
  },
  {
    name: '角色管理',
    icon: 'crown',
    path: '/role/manage',
    component: './role',
    access: 'isSysadmin',
  },
  {
    name: '邮件通知',
    icon: 'mail',
    path: '/settings/email',
    component: './EmailSettings',
    access: 'isSysadmin',
  },
  {
    name: '邀请码',
    icon: 'key',
    path: '/user/invite',
    component: './user/invite',
  },
  {
    name: '应用管理',
    icon: 'api',
    path: '/client/manage',
    component: './client',
    access: 'isSysadmin',
  },
  {
    name: 'Prompt 管理',
    icon: 'robot',
    path: '/ai/prompt',
    component: './ai/Prompt',
    access: 'isSysadmin',
  },
  {
    name: '公告管理',
    icon: 'notification',
    path: '/settings/affiche',
    component: './settings/Affiche',
    access: 'isAdmin',
  },
  { path: '/', redirect: '/nav/admin' },
  { path: '/*', component: '@/404' },
];

// 页面标题和子标题映射
export const pageTitles: Record<
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
  '/nav/bookmarks': {
    title: '书签导入',
    subtitle: '批量导入浏览器书签',
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
  '/user/manage': {
    title: '用户管理',
    subtitle: '管理平台用户与权限',
    showUserMenu: true,
    showSearch: false,
  },
  '/role/manage': {
    title: '角色管理',
    subtitle: '定义与分配角色权限',
    showUserMenu: true,
    showSearch: false,
  },
  '/settings/email': {
    title: '邮件通知',
    subtitle: '配置 SMTP 与通知收件人',
    showUserMenu: true,
    showSearch: false,
  },
  '/user/invite': {
    title: '邀请码',
    subtitle: '创建与管理用户邀请码',
    showUserMenu: true,
    showSearch: false,
  },
  '/client/manage': {
    title: '应用管理',
    subtitle: '管理客户端应用与凭证',
    showUserMenu: true,
    showSearch: false,
  },
  '/ai/prompt': {
    title: 'Prompt 管理',
    subtitle: '管理 AI 对话 Prompt 模板',
    showUserMenu: true,
    showSearch: false,
  },
  '/settings/affiche': {
    title: '公告管理',
    subtitle: '配置首页公告内容与展示',
    showUserMenu: true,
    showSearch: false,
  },
};
