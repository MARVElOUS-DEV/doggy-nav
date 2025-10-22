import assert from 'assert';
import { computeEffectiveRoles } from '../../../app/utils/rbac';

describe('rbac utils - computeEffectiveRoles', () => {
  it('main source: sysadmin preserved', () => {
    assert.deepStrictEqual(computeEffectiveRoles(['sysadmin'], 'main'), ['sysadmin']);
  });
  it('main source: viewer preserved', () => {
    assert.deepStrictEqual(computeEffectiveRoles(['viewer'], 'main'), ['viewer']);
  });
  it('main source: admin/custom normalized to user', () => {
    assert.deepStrictEqual(computeEffectiveRoles(['admin'], 'main'), ['user']);
    assert.deepStrictEqual(computeEffectiveRoles(['editor'], 'main'), ['user']);
    assert.deepStrictEqual(computeEffectiveRoles(['moderator'], 'main'), ['user']);
    assert.deepStrictEqual(computeEffectiveRoles(['user'], 'main'), ['user']);
  });
  it('admin source: only sysadmin/admin allowed', () => {
    assert.deepStrictEqual(computeEffectiveRoles(['sysadmin'], 'admin'), ['sysadmin']);
    assert.deepStrictEqual(computeEffectiveRoles(['admin'], 'admin'), ['admin']);
    assert.deepStrictEqual(computeEffectiveRoles(['user'], 'admin'), []);
    assert.deepStrictEqual(computeEffectiveRoles(['viewer'], 'admin'), []);
    assert.deepStrictEqual(computeEffectiveRoles(['editor'], 'admin'), []);
  });
});
