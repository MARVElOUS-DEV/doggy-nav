import type { ToolOutputDirection, ToolOutputPublication } from '../types/types';

export interface ToolOutputPublicationUpsertInput {
  toolId: string;
  enabled: boolean;
  direction: ToolOutputDirection;
  contentType: string;
  output: string;
  basicAuthUsername: string;
  basicAuthPassword?: string;
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
  getByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication | null>;
  upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication>;
  deleteByUserAndTool(userId: string, toolId: string): Promise<{ ok: boolean }>;
  readPublishedWithBasicAuth(
    publishId: string,
    username: string,
    password: string
  ): Promise<PublishedToolOutputReadResult>;
}
