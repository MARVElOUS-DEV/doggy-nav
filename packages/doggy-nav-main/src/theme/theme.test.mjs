import assert from 'node:assert/strict';
import {
  defaultCustomTheme,
  normalizeThemePreferences,
  resolveTheme,
  validateCustomTheme,
} from './theme.ts';

assert.equal(resolveTheme('system', true), 'dark');
assert.equal(validateCustomTheme(defaultCustomTheme()), null);
assert.equal(
  validateCustomTheme({
    ...defaultCustomTheme(),
    light: { background: '#ffffff', primary: '#ffff00' },
  }),
  'light_primary'
);
assert.deepEqual(normalizeThemePreferences({ mode: 'broken', palette: 'broken' }, 'dark'), {
  mode: 'dark',
  palette: 'editorial',
  custom: defaultCustomTheme(),
});
