import { testAuthRefresh } from '../../../scripts/test-auth-refresh.mjs';

testAuthRefresh(
  new URL('../src/utils/session.ts', import.meta.url),
  'requestAdminRefresh',
);
