import { Service } from 'egg';
import * as bcrypt from 'bcrypt';
import { ValidationError, AuthenticationError, ConflictError, NotFoundError } from '../core/errors';

export default class UserService extends Service {

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
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
    const { ctx, app } = this;
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

    await ctx.model.User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
    }, { useFindAndModify: false });

    const token = app.jwt.sign({
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    }, app.config.jwt.secret, {
      expiresIn: '24h',
    });

    return {
      token: 'Bearer ' + token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
      },
    };
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
