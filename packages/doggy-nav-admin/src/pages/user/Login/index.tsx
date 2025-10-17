import {
  LockOutlined, UserOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import ProForm, { ProFormText } from '@ant-design/pro-form';
import { Link, history, useLocation } from '@umijs/max';
import Footer from '@/components/Footer';
import styles from './index.less';
import { login } from "@/services/api";


const goto = (search: URLSearchParams) => {
  if (!history) return;
  setTimeout(() => {
    const redirect = search.get('redirect')
    history.push(redirect || '/');
  }, 10);
};

const Login: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const {search: searchStr} = useLocation();
  const search = new URLSearchParams(searchStr);
  const formRef = useRef<any>();

  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !submitting) {
      event.preventDefault();
      if (formRef.current) {
        formRef.current.submit();
      }
    }
  };

  // Add global Enter key listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !submitting) {
        // Check if focus is within the login form
        const activeElement = document.activeElement;
        const isFormElement = activeElement?.closest('.ant-form, .ant-input, .ant-input-password');

        if (isFormElement && formRef.current) {
          event.preventDefault();
          formRef.current.submit();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [submitting]);

  const handleSubmit = async (values: API.LoginParams) => {
    setSubmitting(true);

    try {
      // 登录
      const res: any = await login({username: values.username as string, password: values.password as string});

      if (res?.data) {
        const defaultloginSuccessMessage = '登录成功！';
        message.success(defaultloginSuccessMessage);
        // With cookie-based authentication, no need to store tokens locally
        goto(search);
        return;
      } // 如果失败去设置用户错误信息

      message.error(res?.msg)
    } catch (error:any) {
      const defaultloginFailureMessage = '登录失败，请重试！';
      message.error(defaultloginFailureMessage);
    }

    setSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.header}>
            <Link to="/">
              <img alt="logo" className={styles.logo} src="/logo-icon.png"/>
              <span className={styles.title}>狗狗导航</span>
            </Link>
          </div>
          <div className={styles.desc}>{'狗狗导航--记录个人/团队成长过程的资源导航平台'}</div>
        </div>

        <div className={styles.main}>
          <ProForm
            formRef={formRef}
            initialValues={{
              autoLogin: true,
            }}
            submitter={{
              searchConfig: {
                submitText: '登录',
              },
              render: (_, dom) => dom.pop(),
              submitButtonProps: {
                loading: submitting,
                size: 'large',
                style: {
                  width: '100%',
                },
              },
            }}
            onFinish={async (values) => {
              handleSubmit(values as API.LoginParams);
            }}
          >


            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={styles.prefixIcon}/>,
                  onKeyDown: handleKeyDown,
                }}
                placeholder={'输入用户名'}
                rules={[
                  {
                    required: true,
                    message: '用户名是必填项！',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon}/>,
                  onKeyDown: handleKeyDown,
                }}
                placeholder={'输入密码'}
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                ]}
              />
            </>

          </ProForm>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Login;
