import { Settings as LayoutSettings } from '@ant-design/pro-layout';

const Settings: LayoutSettings & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  title: '狗狗导航',
  pwa: false,
  logo: '/logo-icon.png',
};

export default Settings;
