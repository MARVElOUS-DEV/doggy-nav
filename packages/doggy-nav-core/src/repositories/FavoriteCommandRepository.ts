export interface FavoriteCommandRepository {
  addFavorite(userId: string, navId: string): Promise<{ id: string; userId: string; navId: string }>;
  removeFavorite(userId: string, navId: string): Promise<{ ok: boolean }>;
}
