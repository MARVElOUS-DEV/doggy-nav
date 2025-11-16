import {
  Container,
  GroupService,
  CategoryService,
  NavService,
  FavoriteService,
  FavoriteCommandService,
  FavoriteFolderService,
  InviteCodeService,
  TagService,
  TranslateService,
  UserService,
  UserAuthService,
  RoleService,
  EmailSettingsService,
  ApplicationService,
  NavAdminService,
  PromptService,
  AfficheService,
} from 'doggy-nav-core';
import D1GroupRepository from '../adapters/d1GroupRepository';
import D1CategoryRepository from '../adapters/d1CategoryRepository';
import D1NavRepository from '../adapters/d1NavRepository';
import D1FavoriteRepository from '../adapters/d1FavoriteRepository';
import D1FavoriteCommandRepository from '../adapters/d1FavoriteCommandRepository';
import D1FavoriteFolderRepository from '../adapters/d1FavoriteFolderRepository';
import D1InviteCodeRepository from '../adapters/d1InviteCodeRepository';
import D1TagRepository from '../adapters/d1TagRepository';
import FetchTranslateProvider from '../adapters/translateProvider';
import { D1RoleRepository } from '../adapters/d1RoleRepository';
import { D1UserRepository } from '../adapters/d1UserRepository';
import D1UserRepositoryAdapter from '../adapters/d1UserRepositoryAdapter';
import D1AuthRepositoryAdapter from '../adapters/d1AuthRepositoryAdapter';
import D1EmailSettingsRepositoryAdapter from '../adapters/d1EmailSettingsRepositoryAdapter';
import D1ApplicationRepositoryAdapter from '../adapters/d1ApplicationRepositoryAdapter';
import D1NavAdminRepository from '../adapters/d1NavAdminRepository';
import D1PromptRepository from '../adapters/d1PromptRepository';
import D1AfficheRepository from '../adapters/d1AfficheRepository';
import { TOKENS } from './tokens';

type Env = { DB: D1Database };

export function createWorkerContainer(env: Env) {
  const c = new Container();
  // Repos
  c.register(TOKENS.UserRepo, () => new D1UserRepository(env.DB));
  c.register(TOKENS.RoleRepo, () => new D1RoleRepository(env.DB));
  c.register(TOKENS.CategoryRepo, () => new D1CategoryRepository(env.DB));
  c.register(TOKENS.NavRepo, () => new D1NavRepository(env.DB));
  c.register(TOKENS.GroupRepo, () => new D1GroupRepository(env.DB));
  c.register(TOKENS.TagRepo, () => new D1TagRepository(env.DB));
  // Services
  c.register(TOKENS.GroupService, () => new GroupService(new D1GroupRepository(env.DB)));
  c.register(TOKENS.CategoryService, () => new CategoryService(new D1CategoryRepository(env.DB)));
  c.register(
    TOKENS.NavService,
    () => new NavService(new D1NavRepository(env.DB), new D1CategoryRepository(env.DB))
  );
  c.register(TOKENS.FavoriteService, () => new FavoriteService(new D1FavoriteRepository(env.DB)));
  c.register(
    TOKENS.FavoriteCommandService,
    () => new FavoriteCommandService(new D1FavoriteCommandRepository(env.DB))
  );
  c.register(
    TOKENS.FavoriteFolderService,
    () => new FavoriteFolderService(new D1FavoriteFolderRepository(env.DB))
  );
  c.register(
    TOKENS.InviteCodeService,
    () => new InviteCodeService(new D1InviteCodeRepository(env.DB))
  );
  c.register(TOKENS.TagService, () => new TagService(new D1TagRepository(env.DB)));
  c.register(TOKENS.TranslateService, () => new TranslateService(new FetchTranslateProvider()));
  c.register(TOKENS.UserService, () => new UserService(new D1UserRepositoryAdapter(env.DB)));
  c.register(TOKENS.AuthService, () => new UserAuthService(new D1AuthRepositoryAdapter(env.DB)));
  c.register(TOKENS.RoleService, () => new RoleService(new D1RoleRepository(env.DB)));
  c.register(TOKENS.EmailSettingsService, () => new EmailSettingsService(new D1EmailSettingsRepositoryAdapter(env.DB)));
  c.register(TOKENS.ApplicationService, () => new ApplicationService(new D1ApplicationRepositoryAdapter(env.DB)));
  c.register(TOKENS.NavAdminService, () => new NavAdminService(new D1NavAdminRepository(env.DB)));
  c.register(TOKENS.PromptService, () => new PromptService(new D1PromptRepository(env.DB)));
  c.register(TOKENS.AfficheService, () => new AfficheService(new D1AfficheRepository(env.DB)));
  return c;
}
