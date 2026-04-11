import type {
  PublishedToolOutputReadResult,
  ToolOutputPublicationRepository,
  ToolOutputPublicationUpsertInput,
} from '../repositories/ToolOutputPublicationRepository';
import type { ToolOutputPublication } from '../types/types';

const DEFAULT_TOOL_ID = 'json-yaml-converter';

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

export class ToolOutputPublicationService {
  constructor(private readonly repo: ToolOutputPublicationRepository) {}

  async getForUser(userId: string, toolId = DEFAULT_TOOL_ID): Promise<ToolOutputPublication | null> {
    return this.repo.getByUserAndTool(String(userId), String(toolId));
  }

  async saveForUser(
    userId: string,
    input: Omit<ToolOutputPublicationUpsertInput, 'toolId'> & { toolId?: string }
  ): Promise<ToolOutputPublication> {
    const toolId = normalizeText(input.toolId || DEFAULT_TOOL_ID) || DEFAULT_TOOL_ID;
    const output = String(input.output ?? '');
    const basicAuthUsername = normalizeText(input.basicAuthUsername);
    const contentType = normalizeText(input.contentType);
    const basicAuthPassword = normalizeText(input.basicAuthPassword);

    if (!output) {
      throw new Error('Published output is required');
    }
    if (!contentType) {
      throw new Error('Content type is required');
    }
    if (input.direction !== 'yaml-to-json' && input.direction !== 'json-to-yaml') {
      throw new Error('Invalid converter direction');
    }
    if (!basicAuthUsername) {
      throw new Error('Basic Auth username is required');
    }

    const existing = await this.repo.getByUserAndTool(String(userId), toolId);
    if (!existing && !basicAuthPassword) {
      throw new Error('Basic Auth password is required');
    }
    if (basicAuthPassword && basicAuthPassword.length < 8) {
      throw new Error('Basic Auth password must be at least 8 characters');
    }

    return this.repo.upsertByUserAndTool(String(userId), {
      toolId,
      enabled: !!input.enabled,
      direction: input.direction,
      contentType,
      output,
      basicAuthUsername,
      basicAuthPassword: basicAuthPassword || undefined,
    });
  }

  async deleteForUser(userId: string, toolId = DEFAULT_TOOL_ID): Promise<{ ok: boolean }> {
    return this.repo.deleteByUserAndTool(String(userId), String(toolId));
  }

  async readPublished(
    publishId: string,
    username: string,
    password: string
  ): Promise<PublishedToolOutputReadResult> {
    if (!normalizeText(publishId)) return { kind: 'not_found' };
    if (!normalizeText(username) || !password) return { kind: 'unauthorized' };
    return this.repo.readPublishedWithBasicAuth(String(publishId), username, password);
  }
}

export default ToolOutputPublicationService;
