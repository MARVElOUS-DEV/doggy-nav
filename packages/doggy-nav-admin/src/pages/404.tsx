import { Button, Result } from 'antd';
import React from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-layout';

const NoFoundPage: React.FC = () => (
  <PageContainer header={{title: false}}>
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          Back Home
        </Button>
      }
    />
  </PageContainer>
);

export default NoFoundPage;
