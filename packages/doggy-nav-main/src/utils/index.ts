import { getI18n } from 'react-i18next';

export const t = (...args) => {
  const [key, ...params] = args;
  if (typeof key !== 'string') {
    throw new Error('key must be a string');
  }
  const i18Key = `translation~${key}`;
  const fArgs = params && params.length ?[i18Key, ...params]: [i18Key];
  return getI18n().t.bind(getI18n())(...(fArgs as any));
};