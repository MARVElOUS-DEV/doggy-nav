import { useState } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import type { LoginFormValues } from '@/types';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

export default function LoginPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [, dispatchAuth] = useAtom(authActionsAtom);
  const router = useRouter();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { user,token } = await api.login(values);
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: { ...user, id: user.id??"admin" },
          token,
        },
      })

      Message.success(t('login_successful'));

      // Redirect to home or previous page
      const redirectTo = (router.query.redirect as string) || '/';
      router.push(redirectTo);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        Message.error((error as { message?: string }).message || t('login_failed'));
      } else {
        Message.error(t('login_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        {/* Glass card */}
        <div className="bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-80 backdrop-filter backdrop-blur-lg backdrop-saturate-150 rounded-2xl border border-white dark:border-gray-600 border-opacity-30 dark:border-opacity-50 shadow-2xl p-8 w-full max-w-md">
          {/* Logo and title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{t('welcome_back')}</h1>
            <p className="text-gray-600 dark:text-gray-300">{t('sign_in_to_account')}</p>
          </motion.div>

          {/* Login form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Form
              form={form}
              onSubmit={handleSubmit}
              layout="vertical"
              requiredSymbol={false}
            >
              <FormItem
                label={<span className="text-gray-700 dark:text-gray-300 font-medium">{t('username')}</span>}
                field="username"
                rules={[
                  { required: true, message: t('username_required') },
                  { minLength: 3, message: t('username_min_length') }
                ]}
              >
                <Input
                  placeholder={t('enter_username')}
                  size="large"
                  className="bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-80 border-white dark:border-gray-500 border-opacity-30 dark:border-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl text-gray-900 dark:text-gray-100"
                  prefix={<i className="iconfont icon-user text-gray-400 dark:text-gray-300"></i>}
                />
              </FormItem>

              <FormItem
                label={<span className="text-gray-700 dark:text-gray-300 font-medium">{t('password')}</span>}
                field="password"
                rules={[
                  { required: true, message: t('password_required') },
                  { minLength: 6, message: t('password_min_length') }
                ]}
              >
                <Input.Password
                  placeholder={t('enter_password')}
                  size="large"
                  className="bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-80 border-white dark:border-gray-500 border-opacity-30 dark:border-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl text-gray-900 dark:text-gray-100"
                  prefix={<i className="iconfont icon-lock text-gray-400 dark:text-gray-300"></i>}
                />
              </FormItem>

              <FormItem>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? t('signing_in') : t('sign_in_button')}
                </Button>
              </FormItem>
            </Form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('no_account')}{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors duration-200"
              >
                {t('sign_up')}
              </button>
            </p>
            <div className="mt-4 pt-4 border-t border-white dark:border-gray-600 border-opacity-30 dark:border-opacity-50">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors duration-200"
              >
                {t('back_to_home')}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Use custom layout to hide sidebar and header
LoginPage.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};