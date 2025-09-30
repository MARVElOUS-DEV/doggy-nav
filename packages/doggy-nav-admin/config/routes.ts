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
  {name: '分类列表', icon: 'book', path: '/nav/category', component: './nav/Category'},
  {name: '标签列表', icon: 'tag', path: '/nav/tag', component: './nav/Tag'},
  {name: '用户管理', icon: 'user', path: '/user/manage', component: './user'},
  {name: '应用管理', icon: 'api', path: '/client/manage', component: './client'},
  {path: '/', redirect: '/nav/admin'},
  {path: '/*',component: '@/404'},
];
