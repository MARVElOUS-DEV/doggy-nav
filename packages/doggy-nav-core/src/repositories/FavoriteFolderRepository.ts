import type { FavoriteFolder } from '../types/types';

export interface CreateFolderInput {
  name: string;
  order?: number | null;
  navIds?: string[];
}

export interface UpdateFolderInput {
  name?: string;
  order?: number | null;
  addNavIds?: string[];
  removeNavIds?: string[];
}

export interface PlacementsInput {
  root?: Array<{ navId: string; order?: number | null }>;
  folders?: Array<{ folderId: string; order?: number | null }>;
  moves?: Array<{ navId: string; order?: number | null; parentFolderId?: string | null }>;
}

export interface FavoriteFolderRepository {
  createFolder(userId: string, input: CreateFolderInput): Promise<FavoriteFolder>;
  updateFolder(
    userId: string,
    id: string,
    input: UpdateFolderInput
  ): Promise<{ id: string; name?: string; order?: number | null }>;
  deleteFolder(userId: string, id: string): Promise<{ id: string }>;
  placements(userId: string, input: PlacementsInput): Promise<{ ok: boolean }>;
}
