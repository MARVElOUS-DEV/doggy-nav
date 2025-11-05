import type { FavoriteFolderRepository, CreateFolderInput, UpdateFolderInput, PlacementsInput } from '../repositories/FavoriteFolderRepository';

export class FavoriteFolderService {
  constructor(private readonly repo: FavoriteFolderRepository) {}

  async createFolder(userId: string, input: CreateFolderInput) {
    if (!input.name || !String(input.name).trim()) {
      const err = new Error('name is required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.createFolder(String(userId), input);
  }

  async updateFolder(userId: string, id: string, input: UpdateFolderInput) {
    if (!id) {
      const err = new Error('id is required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.updateFolder(String(userId), String(id), input);
  }

  async deleteFolder(userId: string, id: string) {
    if (!id) {
      const err = new Error('id is required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.deleteFolder(String(userId), String(id));
  }

  async placements(userId: string, input: PlacementsInput) {
    return this.repo.placements(String(userId), input);
  }
}

export default FavoriteFolderService;
