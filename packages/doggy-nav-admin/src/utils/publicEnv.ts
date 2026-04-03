const QUOTED_VALUE_PATTERN = /^(['"])(.*)\1$/s;

type PublicEnvKey = 'UMI_APP_COPY_RIGHT_TEXT' | 'UMI_APP_IMAGE_SERVICE_URL';

function normalizePublicEnvValue(value?: string | null) {
  if (typeof value !== 'string') {
    return '';
  }

  let normalized = value.trim();
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return '';
  }

  let matched = QUOTED_VALUE_PATTERN.exec(normalized);
  while (matched) {
    normalized = matched[2].trim();
    matched = QUOTED_VALUE_PATTERN.exec(normalized);
  }

  return normalized;
}

export function getPublicEnv(key: PublicEnvKey, fallback = '') {
  const runtimeValue =
    typeof window !== 'undefined'
      ? window.__DOGGY_NAV_RUNTIME_CONFIG__?.[key]
      : undefined;

  return normalizePublicEnvValue(runtimeValue ?? process.env[key] ?? fallback);
}
