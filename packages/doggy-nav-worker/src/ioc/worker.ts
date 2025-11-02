import { Container, GroupService, CategoryService, NavService, FavoriteService, FavoriteCommandService, InviteCodeService } from 'doggy-nav-core';
import D1GroupRepository from '../adapters/d1GroupRepository';
import D1CategoryRepository from '../adapters/d1CategoryRepository';
import D1NavRepository from '../adapters/d1NavRepository';
import D1FavoriteRepository from '../adapters/d1FavoriteRepository';
import D1FavoriteCommandRepository from '../adapters/d1FavoriteCommandRepository';
import D1InviteCodeRepository from '../adapters/d1InviteCodeRepository';
import { D1RoleRepository } from '../adapters/d1RoleRepository';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { TOKENS } from './tokens';

type Env = { DB: D1Database };

export function createWorkerContainer(env: Env) {
  const c = new Container();

  // Repos
  c.register(TOKENS.UserRepo, () => new D1UserRepository(env.DB));
  c.register(TOKENS.RoleRepo, () => new D1RoleRepository(env.DB));
  c.register(TOKENS.CategoryRepo, () => new D1CategoryRepository(env.DB));
  c.register(TOKENS.NavRepo, () => new D1NavRepository(env.DB));

  // Services
  c.register(TOKENS.GroupService, () => new GroupService(new D1GroupRepository(env.DB)));
  c.register(TOKENS.CategoryService, () => new CategoryService(new D1CategoryRepository(env.DB)));
  c.register(TOKENS.NavService, () => new NavService(new D1NavRepository(env.DB), new D1CategoryRepository(env.DB)));
  c.register(TOKENS.FavoriteService, () => new FavoriteService(new D1FavoriteRepository(env.DB)));
  c.register(TOKENS.FavoriteCommandService, () => new FavoriteCommandService(new D1FavoriteCommandRepository(env.DB)));
  c.register(TOKENS.InviteCodeService, () => new InviteCodeService(new D1InviteCodeRepository(env.DB)));

  return c;
}
