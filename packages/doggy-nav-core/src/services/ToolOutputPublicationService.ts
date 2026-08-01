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

function getSlot(toolId: string, baseToolId: string) {
  return toolId === baseToolId ? 0 : Number(toolId.slice(baseToolId.length + 1));
}

export class ToolOutputPublicationService {
  constructor(private readonly repo: ToolOutputPublicationRepository) {}

  async listForUser(userId: string, toolId = DEFAULT_TOOL_ID) {
    const [items, limit] = await Promise.all([
      this.repo.listByUserAndTool(String(userId), String(toolId)),
      this.repo.getUserLimit(String(userId)),
    ]);
    return {
      items: [...items].sort(
        (left, right) => getSlot(left.toolId, toolId) - getSlot(right.toolId, toolId)
      ),
      limit,
    };
  }

  async saveForUser(
    userId: string,
    input: Omit<ToolOutputPublicationUpsertInput, 'toolId'> & { toolId?: string }
  ): Promise<ToolOutputPublication> {
    const baseToolId = normalizeText(input.toolId || DEFAULT_TOOL_ID) || DEFAULT_TOOL_ID;
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

    let toolId = baseToolId;
    const publishId = normalizeText(input.publishId);
    if (!publishId) {
      const { items, limit } = await this.listForUser(userId, baseToolId);
      if (items.length >= limit) throw new Error(`Storage limit reached (${limit})`);

      const occupied = new Set(items.map((item) => getSlot(item.toolId, baseToolId)));
      let slot = 0;
      while (occupied.has(slot)) slot += 1;
      toolId = slot === 0 ? baseToolId : `${baseToolId}:${slot}`;
    }

    return this.repo.upsertByUserAndTool(String(userId), {
      toolId,
      publishId: publishId || undefined,
      enabled: !!input.enabled,
      direction: input.direction,
      contentType,
      output,
    });
  }

  async rotateTokenForUser(userId: string, publishId: string): Promise<ToolOutputPublication> {
    if (!normalizeText(publishId)) throw new Error('Published output does not exist');
    const publication = await this.repo.rotateTokenByUserAndPublishId(
      String(userId),
      normalizeText(publishId)
    );
    if (!publication) {
      throw new Error('Published output does not exist');
    }
    return publication;
  }

  async deleteForUser(userId: string, publishId: string): Promise<{ ok: boolean }> {
    if (!normalizeText(publishId)) throw new Error('Published output does not exist');
    return this.repo.deleteByUserAndPublishId(String(userId), normalizeText(publishId));
  }

  async readPublished(publishId: string, token: string): Promise<PublishedToolOutputReadResult> {
    if (!normalizeText(publishId)) return { kind: 'not_found' };
    if (!normalizeText(token)) return { kind: 'unauthorized' };
    return this.repo.readPublishedWithToken(String(publishId), token);
  }
}

export default ToolOutputPublicationService;
