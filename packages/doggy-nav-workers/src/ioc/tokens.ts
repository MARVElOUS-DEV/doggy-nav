import type {
  GroupService,
  CategoryService,
  NavService,
  FavoriteService,
  FavoriteCommandService,
  InviteCodeService,
  TagService,
  Token,
} from 'doggy-nav-core';

export const TOKENS = {
  GroupService: Symbol('GroupService') as Token<GroupService>,
  CategoryService: Symbol('CategoryService') as Token<CategoryService>,
  NavService: Symbol('NavService') as Token<NavService>,
  FavoriteService: Symbol('FavoriteService') as Token<FavoriteService>,
  FavoriteCommandService: Symbol('FavoriteCommandService') as Token<FavoriteCommandService>,
  InviteCodeService: Symbol('InviteCodeService') as Token<InviteCodeService>,
  TagService: Symbol('TagService') as Token<TagService>,
  UserRepo: Symbol('UserRepo') as Token<any>,
  RoleRepo: Symbol('RoleRepo') as Token<any>,
  CategoryRepo: Symbol('CategoryRepo') as Token<any>,
  NavRepo: Symbol('NavRepo') as Token<any>,
  GroupRepo: Symbol('GroupRepo') as Token<any>,
  TagRepo: Symbol('TagRepo') as Token<any>,
};
