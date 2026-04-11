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
    const contentType = normalizeText(input.contentType);

    if (!output) {
      throw new Error('Published output is required');
    }
    if (!contentType) {
      throw new Error('Content type is required');
    }
    if (input.direction !== 'yaml-to-json' && input.direction !== 'json-to-yaml') {
      throw new Error('Invalid converter direction');
    }

    return this.repo.upsertByUserAndTool(String(userId), {
      toolId,
      enabled: !!input.enabled,
      direction: input.direction,
      contentType,
      output,
    });
  }

  async rotateTokenForUser(userId: string, toolId = DEFAULT_TOOL_ID): Promise<ToolOutputPublication> {
    const publication = await this.repo.rotateTokenByUserAndTool(String(userId), String(toolId));
    if (!publication) {
      throw new Error('Published output does not exist');
    }
    return publication;
  }

  async deleteForUser(userId: string, toolId = DEFAULT_TOOL_ID): Promise<{ ok: boolean }> {
    return this.repo.deleteByUserAndTool(String(userId), String(toolId));
  }

  async readPublished(publishId: string, token: string): Promise<PublishedToolOutputReadResult> {
    if (!normalizeText(publishId)) return { kind: 'not_found' };
    if (!normalizeText(token)) return { kind: 'unauthorized' };
    return this.repo.readPublishedWithToken(String(publishId), token);
  }
}

export default ToolOutputPublicationService;
