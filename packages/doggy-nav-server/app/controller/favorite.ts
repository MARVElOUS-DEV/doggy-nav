import Controller from '../core/base_controller';
import { TOKENS } from '../core/ioc';

export default class FavoriteController extends Controller {
  tableName(): string {
    return 'Favorite';
  }

  /**
   * Add a nav item to user's favorites
   */
  async add() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedBody();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      const cmd = ctx.di.resolve(TOKENS.FavoriteCommandService);
      const created = await cmd.add(String(userInfo.userId), String(navId));
      this.success(created);
    } catch (error: any) {
      console.error('Add favorite error:', error);
      this.error(error.message || '收藏失败');
    }
  }

  /**
   * Get user's favorites in structured form: union of root items and folders (with items)
   */
  async structured() {
    const { ctx } = this;

    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();

    try {
      const service = ctx.di.resolve(TOKENS.FavoriteService);
      const res = await service.structured(String(userInfo.userId));
      this.success(res);
    } catch (error: any) {
      console.error('Get structured favorites error:', error);
      this.error(error.message || '获取收藏结构失败');
    }
  }

  /**
   * Create a folder and optionally move items into it
   */
  async createFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { name, navIds = [], order } = this.getSanitizedBody();
    if (!name) {
      this.error('name is required');
      return;
    }
    try {
      const service = ctx.di.resolve(TOKENS.FavoriteFolderService);
      const res = await service.createFolder(String(userInfo.userId), { name, navIds, order });
      this.success(res);
    } catch (error: any) {
      console.error('Create favorite folder error:', error);
      this.error(error.message || '创建文件夹失败');
    }
  }

  /**
   * Update folder (rename, membership, order)
   */
  async updateFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { id } = ctx.params;
    const { name, addNavIds = [], removeNavIds = [], order } = this.getSanitizedBody();
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      const service = ctx.di.resolve(TOKENS.FavoriteFolderService);
      const res = await service.updateFolder(String(userInfo.userId), String(id), { name, order, addNavIds, removeNavIds });
      this.success(res);
    } catch (error: any) {
      console.error('Update favorite folder error:', error);
      this.error(error.message || '更新文件夹失败');
    }
  }

  /**
   * Delete folder; move items to root
   */
  async deleteFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { id } = ctx.params;
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      const service = ctx.di.resolve(TOKENS.FavoriteFolderService);
      const res = await service.deleteFolder(String(userInfo.userId), String(id));
      this.success(res);
    } catch (error: any) {
      console.error('Delete favorite folder error:', error);
      this.error(error.message || '删除文件夹失败');
    }
  }

  /**
   * Bulk placements: reorder/move items and folders
   */
  async placements() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { root = [], folders = [], moves = [] } = this.getSanitizedBody();

    try {
      const service = ctx.di.resolve(TOKENS.FavoriteFolderService);
      const res = await service.placements(String(userInfo.userId), { root, folders, moves });
      this.success(res);
    } catch (error: any) {
      console.error('Update placements error:', error);
      this.error(error.message || '更新排序失败');
    }
  }

  /**
   * Remove a nav item from user's favorites
   */
  async remove() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedQuery();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      const cmd = ctx.di.resolve(TOKENS.FavoriteCommandService);
      const res = await cmd.remove(String(userInfo.userId), String(navId));
      if (!res.ok) return this.error('收藏不存在');
      this.success({ message: '取消收藏成功' });
    } catch (error: any) {
      console.error('Remove favorite error:', error);
      this.error(error.message || '取消收藏失败');
    }
  }

  /**
   * Get user's favorite list with nav item details
   */
  async list() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const query = this.getSanitizedQuery();

    try {
      const service = ctx.di.resolve(TOKENS.FavoriteService);
      const res = await service.list(String(userInfo.userId), {
        pageSize: query.pageSize,
        pageNumber: query.pageNumber,
      } as any);
      this.success(res);
    } catch (error: any) {
      console.error('Get favorites list error:', error);
      this.error(error.message || '获取收藏列表失败');
    }
  }

  /**
   * Check if a nav item is favorited by current user
   */
  async check() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.success({ isFavorite: false });
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedQuery();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      const service = ctx.di.resolve(TOKENS.FavoriteService);
      const res = await service.check(String(userInfo.userId), String(navId));
      this.success(res);
    } catch (error: any) {
      console.error('Check favorite error:', error);
      this.error(error.message || '检查收藏状态失败');
    }
  }

  /**
   * Get user's favorite count
   */
  async count() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.success({ count: 0 });
      return;
    }

    const userInfo = this.getUserInfo();

    try {
      const service = ctx.di.resolve(TOKENS.FavoriteService);
      const res = await service.count(String(userInfo.userId));
      this.success(res);
    } catch (error: any) {
      console.error('Get favorite count error:', error);
      this.error(error.message || '获取收藏数量失败');
    }
  }
}
