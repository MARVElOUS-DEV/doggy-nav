import assert from 'node:assert/strict';
import { AiProviderError, AiProviderService } from '../../dist/index.js';

const configs = ['newest', 'active', 'oldest'].map((name, index) => ({
  id: String(index + 1),
  name,
  provider: 'openai-compatible',
  baseURL: `https://${name}.example`,
  model: 'test',
  apiKey: 'secret',
  apiKeySet: true,
  active: name === 'active',
}));
const activations = [];
const repo = {
  async listConfigs() {
    return configs;
  },
  async setActive(id) {
    configs.forEach((config) => (config.active = config.id === id));
    activations.push(id);
    return configs.find((config) => config.id === id);
  },
};

const service = new AiProviderService(repo);
const attempts = [];
const result = await service.runWithFailover(async (config) => {
  attempts.push(config.name);
  if (config.name === 'active') {
    throw new AiProviderError({ provider: config.provider, message: 'maintenance' });
  }
  return config.name;
});

assert.equal(result, 'oldest');
assert.deepEqual(attempts, ['active', 'oldest']);
assert.deepEqual(activations, ['3']);
assert.equal(configs.find((config) => config.active)?.name, 'oldest');

let alertFailures;
await assert.rejects(
  () =>
    service.runWithFailover(
      async (config) => {
        throw new AiProviderError({ provider: config.provider, message: `${config.name} failed` });
      },
      async (failures) => {
        alertFailures = failures;
      }
    ),
  /active failed/
);
assert.deepEqual(
  alertFailures.map((failure) => failure.name),
  ['oldest', 'newest', 'active']
);
assert.equal(configs.find((config) => config.active)?.name, 'active');
