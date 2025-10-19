export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {path: '/user', routes: [{name: '登录', path: '/user/login', component: './user/Login'}]},
    ],
  },
  {name: '首页', icon: 'home', path: '/nav/admin', component: './Admin'},
  {name: '审核列表', icon: 'audit', path: '/nav/audit', component: './nav/Audit'},
  {name: '导航列表', icon: 'send', path: '/nav/list', component: './nav/List'},
  {name: '书签导入', icon: 'upload', path: '/nav/bookmarks', component: './nav/Bookmarks'},
  {name: '分类列表', icon: 'book', path: '/nav/category', component: './nav/Category'},
  {name: '标签列表', icon: 'tag', path: '/nav/tag', component: './nav/Tag'},
  {name: '用户管理', icon: 'user', path: '/user/manage', component: './user', access: 'isSuperadmin'},
  {name: '分组管理', icon: 'team', path: '/group/manage', component: './group', access: 'isSuperadmin'},
  {name: '角色管理', icon: 'crown', path: '/role/manage', component: './role', access: 'isSuperadmin'},
  {name: '邀请码', icon: 'key', path: '/user/invite', component: './user/invite'},
  {name: '应用管理', icon: 'api', path: '/client/manage', component: './client', access: 'isSuperadmin'},
  {path: '/', redirect: '/nav/admin'},
  {path: '/*',component: '@/404'},
];
