import type {
  Container,
  Token,
  GroupService,
  CategoryService,
  NavService,
  FavoriteService,
  FavoriteCommandService,
  InviteCodeService,
} from 'doggy-nav-core';

// Service tokens
export const TOKENS = {
  GroupService: Symbol('GroupService') as Token<GroupService>,
  CategoryService: Symbol('CategoryService') as Token<CategoryService>,
  NavService: Symbol('NavService') as Token<NavService>,
  FavoriteService: Symbol('FavoriteService') as Token<FavoriteService>,
  FavoriteCommandService: Symbol('FavoriteCommandService') as Token<FavoriteCommandService>,
  InviteCodeService: Symbol('InviteCodeService') as Token<InviteCodeService>,

  // Repository tokens (untyped to avoid coupling)
  RoleRepo: Symbol('RoleRepo') as Token<any>,
  UserRepo: Symbol('UserRepo') as Token<any>,
  CategoryRepo: Symbol('CategoryRepo') as Token<any>,
  NavRepo: Symbol('NavRepo') as Token<any>,
};
