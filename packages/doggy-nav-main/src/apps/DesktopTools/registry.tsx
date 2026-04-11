import type { ReactNode } from 'react';
import YamlJsonConverterApp from './YamlJsonConverter';

export type BuiltInDesktopTool = {
  id: string;
  title: string;
  icon: string;
  iconClass?: string;
  defaultRect: { x: number; y: number; width: number; height: number };
  shortcut?: {
    label?: string;
    description?: string;
    order?: number;
    visible?: boolean;
  };
  render: () => ReactNode;
};

export const builtInDesktopTools: BuiltInDesktopTool[] = [
  {
    id: 'yaml-json-converter',
    title: 'Config Exchange',
    icon: '/app-icons/json-yaml-converter.svg',
    defaultRect: { x: 92, y: 64, width: 1160, height: 740 },
    shortcut: {
      label: 'Config Exchange',
      description: 'Edit JSON and YAML side-by-side with publish controls.',
      order: 1,
      visible: true,
    },
    render: () => <YamlJsonConverterApp />,
  },
];
