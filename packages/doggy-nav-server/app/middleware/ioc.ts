import { Container, GroupService, CategoryService, NavService, FavoriteService, FavoriteCommandService, FavoriteFolderService, InviteCodeService, EmailSettingsService, ApplicationService, RoleService, UserService, TagService, TranslateService, PromptService, AfficheService } from 'doggy-nav-core';
import { TOKENS } from '../core/ioc';
import MongooseGroupRepository from '../../adapters/groupRepository';
import MongooseCategoryRepository from '../../adapters/categoryRepository';
import MongooseNavRepository from '../../adapters/navRepository';
import MongooseFavoriteRepository from '../../adapters/favoriteRepository';
import MongooseFavoriteCommandRepository from '../../adapters/favoriteCommandRepository';
import MongooseFavoriteFolderRepository from '../../adapters/favoriteFolderRepository';
import MongooseInviteCodeRepository from '../../adapters/inviteCodeRepository';
import MongooseEmailSettingsRepository from '../../adapters/emailSettingsRepository';
import MongooseApplicationRepository from '../../adapters/applicationRepository';
import MongooseRoleRepository from '../../adapters/roleRepository';
import MongooseUserRepository from '../../adapters/userRepository';
import MongooseTagRepository from '../../adapters/tagRepository';
import GoogleTranslateProvider from '../../adapters/translateProvider';
import MongoosePromptRepository from '../../adapters/promptRepository';
import MongooseAfficheRepository from '../../adapters/afficheRepository';

export default function ioc() {
  return async (ctx: any, next: any) => {
    const di = new Container();

    // Services (repos are created inline using ctx for Mongoose access)
    di.register(TOKENS.GroupService, () => new GroupService(new MongooseGroupRepository(ctx)));
    di.register(TOKENS.CategoryService, () => new CategoryService(new MongooseCategoryRepository(ctx)));
    di.register(TOKENS.NavService, () => new NavService(new MongooseNavRepository(ctx), new MongooseCategoryRepository(ctx)));
    di.register(TOKENS.FavoriteService, () => new FavoriteService(new MongooseFavoriteRepository(ctx)));
    di.register(TOKENS.FavoriteCommandService, () => new FavoriteCommandService(new MongooseFavoriteCommandRepository(ctx)));
    di.register(TOKENS.FavoriteFolderService, () => new FavoriteFolderService(new MongooseFavoriteFolderRepository(ctx)));
    di.register(TOKENS.InviteCodeService, () => new InviteCodeService(new MongooseInviteCodeRepository(ctx)));
    di.register(TOKENS.EmailSettingsService, () => new EmailSettingsService(new MongooseEmailSettingsRepository(ctx)));
    di.register(TOKENS.ApplicationService, () => new ApplicationService(new MongooseApplicationRepository(ctx)));
    di.register(TOKENS.RoleService, () => new RoleService(new MongooseRoleRepository(ctx)));
    di.register(TOKENS.UserService, () => new UserService(new MongooseUserRepository(ctx)));
    di.register(TOKENS.TagService, () => new TagService(new MongooseTagRepository(ctx)));
    di.register(TOKENS.TranslateService, () => new TranslateService(new GoogleTranslateProvider()));
    di.register(TOKENS.PromptService, () => new PromptService(new MongoosePromptRepository(ctx)));
    di.register(TOKENS.AfficheService, () => new AfficheService(new MongooseAfficheRepository(ctx)));

    ctx.di = di;
    await next();
  };
}
