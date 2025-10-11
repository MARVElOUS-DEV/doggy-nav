import { DefaultFooter } from '@ant-design/pro-layout';
export default () => {
  return (
    <DefaultFooter
      copyright={process?.env?.COPY_RIGHT_TEXT??`2025 狗狗导航`}
      links={[]}
    />
  );
};
