import { responses } from '../utils/responses';

describe('responses util', () => {
  it('ok()', () => {
    const r = responses.ok({ x: 1 });
    expect(r.code).toBe(1);
  });
});
