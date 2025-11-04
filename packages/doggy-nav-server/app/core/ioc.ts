import { Container, Token } from 'doggy-nav-core';
import type {
  GroupService,
  CategoryService,
  NavService,
  FavoriteService,
  FavoriteCommandService,
  FavoriteFolderService,
  InviteCodeService,
  EmailSettingsService,
  ApplicationService,
  RoleService,
  UserService,
  TagService,
  TranslateService,
} from 'doggy-nav-core';

export const TOKENS = {
  GroupService: Symbol('GroupService') as Token<GroupService>,
  CategoryService: Symbol('CategoryService') as Token<CategoryService>,
  NavService: Symbol('NavService') as Token<NavService>,
  FavoriteService: Symbol('FavoriteService') as Token<FavoriteService>,
  FavoriteCommandService: Symbol('FavoriteCommandService') as Token<FavoriteCommandService>,
  FavoriteFolderService: Symbol('FavoriteFolderService') as Token<FavoriteFolderService>,
  InviteCodeService: Symbol('InviteCodeService') as Token<InviteCodeService>,
  EmailSettingsService: Symbol('EmailSettingsService') as Token<EmailSettingsService>,
  ApplicationService: Symbol('ApplicationService') as Token<ApplicationService>,
  RoleService: Symbol('RoleService') as Token<RoleService>,
  UserService: Symbol('UserService') as Token<UserService>,
  TagService: Symbol('TagService') as Token<TagService>,
  TranslateService: Symbol('TranslateService') as Token<TranslateService>,
};

export type AppContainer = Container;
