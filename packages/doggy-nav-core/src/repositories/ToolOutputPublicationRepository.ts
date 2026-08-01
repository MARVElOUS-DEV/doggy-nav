import type { ToolOutputDirection, ToolOutputPublication } from '../types/types';

export interface ToolOutputPublicationUpsertInput {
  toolId: string;
  publishId?: string;
  enabled: boolean;
  direction: ToolOutputDirection;
  contentType: string;
  output: string;
}

export interface PublishedToolOutputResolved {
  toolId: string;
  publishId: string;
  userId: string;
  direction: ToolOutputDirection;
  contentType: string;
  output: string;
}

export type PublishedToolOutputReadResult =
  | { kind: 'ok'; data: PublishedToolOutputResolved }
  | { kind: 'not_found' }
  | { kind: 'unauthorized' };

export interface ToolOutputPublicationRepository {
  listByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication[]>;
  getUserLimit(userId: string): Promise<number>;
  upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication>;
  rotateTokenByUserAndPublishId(
    userId: string,
    publishId: string
  ): Promise<ToolOutputPublication | null>;
  deleteByUserAndPublishId(userId: string, publishId: string): Promise<{ ok: boolean }>;
  readPublishedWithToken(publishId: string, token: string): Promise<PublishedToolOutputReadResult>;
}
