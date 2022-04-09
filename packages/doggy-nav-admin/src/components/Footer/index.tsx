import { DefaultFooter } from '@ant-design/pro-layout';
export default () => {
  const defaultMessage = '狗头导航';
  return (
    <DefaultFooter
      copyright={`2022 ${defaultMessage}`}
      links={[]}
    />
  );
};
