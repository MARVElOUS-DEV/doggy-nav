import { getPublicEnv } from '@/utils/publicEnv';
import { DefaultFooter } from '@ant-design/pro-layout';

export default () => {
  return (
    <DefaultFooter
      copyright={getPublicEnv('UMI_APP_COPY_RIGHT_TEXT', '2025 狗狗导航')}
      links={[]}
    />
  );
};
