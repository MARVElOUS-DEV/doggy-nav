import assert from 'assert';
import { buildAudienceFilterEx } from '../../../app/utils/audienceEx';

const base = { status: 0 };

describe('audienceEx - viewer open-only mode', () => {
  it('viewer in main limits to open/public-only', () => {
    const filter: any = buildAudienceFilterEx(base, { roles: ['viewer'], effectiveRoles: ['viewer'], source: 'main' } as any);
    // should be an $and with base and $or clause
    assert.ok(filter.$and && Array.isArray(filter.$and));
    assert.ok(filter.$and.length === 2);
  });
  it('sysadmin bypass returns base query', () => {
    const filter: any = buildAudienceFilterEx(base, { roles: ['sysadmin'], effectiveRoles: ['sysadmin'], source: 'main' } as any);
    assert.deepStrictEqual(filter, base);
  });
  it('user in main keeps default audience filter (has $or built)', () => {
    const filter: any = buildAudienceFilterEx(base, { roles: ['user'], effectiveRoles: ['user'], source: 'main' } as any);
    // default builder returns $and with $or audience
    assert.ok(filter.$and || filter.$or);
  });
});
