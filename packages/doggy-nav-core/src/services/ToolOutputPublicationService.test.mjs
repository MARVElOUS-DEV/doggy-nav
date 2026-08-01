import assert from 'node:assert/strict';
import { ToolOutputPublicationService } from '../../dist/index.js';

const records = [];
const repo = {
  async listByUserAndTool() {
    return records;
  },
  async getUserLimit() {
    return 2;
  },
  async upsertByUserAndTool(_userId, input) {
    const existing = records.find((item) => item.publishId === input.publishId);
    if (existing) return Object.assign(existing, input);
    const created = {
      ...input,
      publishId: `publish-${records.length}`,
      subscriptionToken: 'token',
    };
    records.push(created);
    return created;
  },
};

const service = new ToolOutputPublicationService(repo);
const input = {
  enabled: true,
  direction: 'yaml-to-json',
  contentType: 'application/json',
  output: '{}',
};
const first = await service.saveForUser('user-1', input);
const second = await service.saveForUser('user-1', input);

assert.equal(first.toolId, 'json-yaml-converter');
assert.equal(second.toolId, 'json-yaml-converter:1');
await assert.rejects(() => service.saveForUser('user-1', input), /Storage limit reached/);
assert.equal((await service.listForUser('user-1')).items.length, 2);
