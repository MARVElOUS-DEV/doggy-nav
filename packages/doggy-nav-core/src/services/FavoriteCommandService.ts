import type { FavoriteCommandRepository } from '../repositories/FavoriteCommandRepository';

export class FavoriteCommandService {
  constructor(private readonly repo: FavoriteCommandRepository) {}

  async add(userId: string, navId: string) {
    if (!userId || !navId) throw new Error('userId and navId are required');
    return this.repo.addFavorite(String(userId), String(navId));
  }

  async remove(userId: string, navId: string) {
    if (!userId || !navId) throw new Error('userId and navId are required');
    return this.repo.removeFavorite(String(userId), String(navId));
  }
}

export default FavoriteCommandService;
