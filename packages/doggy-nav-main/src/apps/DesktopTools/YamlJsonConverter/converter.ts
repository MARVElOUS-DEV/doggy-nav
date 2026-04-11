import { parse, stringify } from 'yaml';

export function convertYamlToFormattedJson(input: string) {
  const parsed = parse(input);
  return JSON.stringify(parsed, null, 2);
}

export function convertJsonToFormattedYaml(input: string) {
  const parsed = JSON.parse(input);
  return stringify(parsed, { indent: 2 });
}
