const toBool = (v: any): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  if (typeof v === 'number') return v !== 0;
  return false;
};

const defaultEnabled = process.env.NODE_ENV !== 'production';

const readToggle = (name: string, def = defaultEnabled): boolean => {
  const env = process.env[name];
  return env === undefined ? def : toBool(env);
};

export const USE_CORE_GROUP = readToggle('USE_CORE_GROUP', true);
export const USE_CORE_CATEGORY = readToggle('USE_CORE_CATEGORY');
export const USE_CORE_NAV = readToggle('USE_CORE_NAV');
export const USE_CORE_FAVORITE = readToggle('USE_CORE_FAVORITE');
export const USE_CORE_TAG = readToggle('USE_CORE_TAG');
export const USE_CORE_USER = readToggle('USE_CORE_USER', false);
export const USE_CORE_ROLE = readToggle('USE_CORE_ROLE');
export const USE_CORE_INVITE_CODE = readToggle('USE_CORE_INVITE_CODE');
export const USE_CORE_EMAIL_SETTINGS = readToggle('USE_CORE_EMAIL_SETTINGS');
export const USE_CORE_TRANSLATE = readToggle('USE_CORE_TRANSLATE');
export const USE_CORE_URL_CHECKER = readToggle('USE_CORE_URL_CHECKER');
export const USE_CORE_APPLICATION = readToggle('USE_CORE_APPLICATION');

export const isCoreEnabled = (domain: string): boolean => {
  const key = `USE_CORE_${domain}`.toUpperCase();
  return readToggle(key);
};

export default {
  USE_CORE_GROUP,
  USE_CORE_CATEGORY,
  USE_CORE_NAV,
  USE_CORE_FAVORITE,
  USE_CORE_TAG,
  USE_CORE_USER,
  USE_CORE_ROLE,
  USE_CORE_INVITE_CODE,
  USE_CORE_EMAIL_SETTINGS,
  USE_CORE_TRANSLATE,
  USE_CORE_URL_CHECKER,
  USE_CORE_APPLICATION,
  isCoreEnabled,
};
