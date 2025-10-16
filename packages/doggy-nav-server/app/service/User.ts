import { Service } from 'egg';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ValidationError, AuthenticationError, ConflictError, NotFoundError } from '../core/errors';

export default class UserService extends Service {

  private buildJwtPayload(user: any) {
    return {
      userId: user._id?.toString() ?? user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };
  }

  async generateTokens(user: any) {
    const { app } = this;
    const payload = this.buildJwtPayload(user);
    const jwtConfig = app.config.jwt as any;
    const accessToken = app.jwt.sign(payload, app.config.jwt.secret, {
      expiresIn: jwtConfig?.accessExpiresIn || '15m',
    });

    const refreshToken = app.jwt.sign({ sub: payload.userId, typ: 'refresh' }, app.config.jwt.secret, {
      expiresIn: jwtConfig?.refreshExpiresIn || '7d',
    });

    return { accessToken, refreshToken, payload };
  }

  private async ensureUniqueUsername(base: string) {
    const { ctx } = this;
    const normalized = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30) || 'user';
    let candidate = normalized;
    let suffix = 1;

    while (await ctx.model.User.findOne({ username: candidate })) {
      candidate = `${normalized}_${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private extractPrimaryEmail(emails: Array<{ value?: string; verified?: boolean }> = []) {
    const verified = emails.find(email => email.verified && email.value);
    if (verified?.value) return verified.value.toLowerCase();
    const first = emails.find(email => email.value);
    return first?.value ? first.value.toLowerCase() : null;
  }

  private generateFallbackEmail(provider: string, providerId: string) {
    return `${provider}_${providerId}@oauth.local`; // placeholder
  }

  private async createUserFromProvider(params: {
    provider: 'github' | 'google' | 'linuxdo';
    providerId: string;
    username?: string | null;
    displayName?: string | null;
    emails: Array<{ value?: string; verified?: boolean }>;
    avatar?: string | null;
  }) {
    const { ctx } = this;
    const email = this.extractPrimaryEmail(params.emails) || this.generateFallbackEmail(params.provider, params.providerId);
    let usernameCandidate = params.username || params.displayName || params.provider;
    usernameCandidate = await this.ensureUniqueUsername(usernameCandidate ?? params.provider);

    const randomPassword = randomBytes(16).toString('hex');
    const hashedPassword = await this.hashPassword(randomPassword);

    const user = await ctx.model.User.create({
      username: usernameCandidate,
      email,
      password: hashedPassword,
      isAdmin: false,
      isActive: true,
      avatar: params.avatar || null,
    });

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async findOrCreateFromProvider(params: {
    provider: 'github' | 'google' | 'linuxdo';
    providerId: string;
    username?: string | null;
    displayName?: string | null;
    emails: Array<{ value?: string; verified?: boolean }>;
    avatar?: string | null;
    raw?: any;
  }) {
    const { ctx } = this;
    const existingLink = await ctx.model.UserProvider.findOne({
      provider: params.provider,
      providerUserId: params.providerId,
    });

    if (existingLink) {
      const linkedUser = await ctx.model.User.findById(existingLink.userId);
      if (linkedUser) {
        return linkedUser;
      }
      ctx.logger.warn('[oauth] dangling provider link detected, removing');
      await ctx.model.UserProvider.deleteOne({ _id: existingLink._id });
    }

    const email = this.extractPrimaryEmail(params.emails);
    if (email) {
      const existingUser = await ctx.model.User.findOne({ email });
      if (existingUser) {
        throw new ConflictError('该邮箱已存在账号，请先使用原始方式登录后在个人设置中绑定此第三方账号');
      }
    }

    const user = await this.createUserFromProvider(params);

    await ctx.model.UserProvider.create({
      userId: user._id,
      provider: params.provider,
      providerUserId: params.providerId,
      email: email ?? undefined,
      avatar: params.avatar ?? undefined,
      profile: params.raw ?? null,
    });

    return user;
  }

  validateUserInput(username: string, email: string, password: string) {
    const errors: string[] = [];

    if (!username || username.trim().length < 3) {
      errors.push('用户名至少需要3个字符');
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('请输入有效的邮箱地址');
    }

    if (!password || password.length < 6) {
      errors.push('密码至少需要6个字符');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('密码必须包含至少一个大写字母、一个小写字母和一个数字');
    }

    return errors;
  }

  async register() {
    const { ctx } = this;
    const { username, email, password } = ctx.request.body;

    const validationErrors = this.validateUserInput(username, email, password);
    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors.join(', '));
    }

    const existingUser = await ctx.model.User.findOne({
      $or: [{ username: username.trim() }, { email: email.toLowerCase().trim() }],
    });

    if (existingUser) {
      throw new ConflictError('用户名或邮箱已存在');
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = await ctx.model.User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isAdmin: false,
      isActive: true,
    });

    const userResponse = {
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt,
      },
    };

    return userResponse;
  }

  async login() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      throw new ValidationError('请输入用户名和密码');
    }

    const user = await ctx.model.User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
      isActive: true,
    });

    if (!user) {
      throw new AuthenticationError('账号或密码错误');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('账号或密码错误');
    }

    await this.recordSuccessfulLogin(user._id);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      token: 'Bearer ' + accessToken,
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
      },
    };
  }

  async recordSuccessfulLogin(userId: string) {
    const { ctx } = this;
    await ctx.model.User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    }, { useFindAndModify: false });
  }

  async getUserProfile(userId: string) {
    const { ctx } = this;

    const user = await ctx.model.User.findById(userId)
      .select('-password -resetPasswordToken')
      .lean();

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return user;
  }

  async getById(userId: string) {
    return await this.getUserProfile(userId);
  }

  async updateProfile(userId: string) {
    const { ctx } = this;
    const { email, avatar } = ctx.request.body;

    const user = await ctx.model.User.findById(userId);

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // Prepare update object
    const updateData: any = {};

    if (email && email !== user.email) {
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        throw new ValidationError('请输入有效的邮箱地址');
      }

      const existingUser = await ctx.model.User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        throw new ConflictError('邮箱已存在');
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      return user.toJSON();
    }

    const updatedUser = await ctx.model.User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, useFindAndModify: false }
    )
      .select('-password -resetPasswordToken')
      .lean();

    return updatedUser;
  }
}
