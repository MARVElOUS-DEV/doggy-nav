import type { PageQuery } from '../dto/pagination';
import type {
  UserRepository,
  UserProfile,
  UpdateProfileInput,
  AdminUserListFilter,
  AdminUserListItem,
  AdminGetUserResponse,
  AdminCreateUserInput,
  AdminUpdateUserInput,
} from '../repositories/UserRepository';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  private isValidEmail(email: string) {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }

  private validatePasswordComplexity(password: string): string[] {
    const errors: string[] = [];
    if (!password || password.length < 6) errors.push('密码至少需要6个字符');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) errors.push('密码必须包含至少一个大写字母、一个小写字母和一个数字');
    return errors;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    return this.repo.getProfile(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    if (input.email && !this.isValidEmail(input.email)) {
      const err = new Error('请输入有效的邮箱地址');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.updateProfile(userId, input);
  }

  async adminList(filter: AdminUserListFilter, page: PageQuery): Promise<{ list: AdminUserListItem[]; total: number }> {
    return this.repo.adminList(filter, page);
  }

  async adminGetOne(id: string): Promise<AdminGetUserResponse | null> {
    return this.repo.adminGetOne(id);
  }

  async adminCreate(input: AdminCreateUserInput): Promise<{ id: string }> {
    if (!input.account || !input.email || !input.password) {
      const err = new Error('账号、邮箱和密码必填');
      (err as any).name = 'ValidationError';
      throw err;
    }
    if (!this.isValidEmail(input.email)) {
      const err = new Error('请输入有效的邮箱地址');
      (err as any).name = 'ValidationError';
      throw err;
    }
    const pwErrors = this.validatePasswordComplexity(input.password);
    if (pwErrors.length) {
      const err = new Error(pwErrors.join(', '));
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.adminCreate(input);
  }

  async adminUpdate(id: string, input: AdminUpdateUserInput): Promise<boolean> {
    if (input.email && !this.isValidEmail(input.email)) {
      const err = new Error('请输入有效的邮箱地址');
      (err as any).name = 'ValidationError';
      throw err;
    }
    if (input.password) {
      const pwErrors = this.validatePasswordComplexity(input.password);
      if (pwErrors.length) {
        const err = new Error(pwErrors.join(', '));
        (err as any).name = 'ValidationError';
        throw err;
      }
    }
    return this.repo.adminUpdate(id, input);
  }

  async adminDelete(ids: string[]): Promise<boolean> {
    if (!Array.isArray(ids) || !ids.length) {
      const err = new Error('缺少ids');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.adminDelete(ids);
  }
}

export default UserService;
