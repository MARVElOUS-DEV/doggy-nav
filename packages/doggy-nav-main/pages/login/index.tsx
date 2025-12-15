import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import { authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import { setAccessExpEpochMs } from '@/utils/session';
import type { LoginFormValues, OAuthProvider } from '@/types';
import { useTranslation } from 'react-i18next';
import { GitHubIcon, GoogleIcon, LinuxDoIcon } from '@/components/OAuthIcons';
import { User, Lock, LogIn } from 'lucide-react';

const FormItem = Form.Item;

export default function LoginPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const dispatchAuth = useSetAtom(authActionsAtom);
  const router = useRouter();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { user } = await api.login(values);
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: { ...user, id: user.id ?? 'admin' },
        },
      });

      Message.success(t('login_successful'));

      // Prime proactive refresh by fetching accessExp after cookies are set
      try {
        const me: any = await api.getCurrentUser();
        if (typeof me?.accessExp === 'number') setAccessExpEpochMs(me.accessExp);
      } catch {}

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

  const providerMeta = useMemo<Record<OAuthProvider, { icon: React.ReactNode; label: string }>>(
    () => ({
      github: {
        icon: <GitHubIcon />,
        label: t('sign_in_with_github', { defaultValue: 'Sign in with GitHub' }),
      },
      google: {
        icon: <GoogleIcon />,
        label: t('sign_in_with_google', { defaultValue: 'Sign in with Google' }),
      },
      linuxdo: {
        icon: <LinuxDoIcon />,
        label: t('sign_in_with_linuxdo', { defaultValue: 'Sign in with LinuxDo' }),
      },
    }),
    [t]
  );

  const handleOAuthLogin = (provider: OAuthProvider) => {
    window.location.href = `/api/auth/${provider}`;
  };

  useEffect(() => {
    let mounted = true;
    api
      .getAuthProviders()
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res?.providers)) {
          const normalized = (res.providers as unknown[]).filter(
            (provider): provider is OAuthProvider =>
              typeof provider === 'string' && provider in providerMeta
          );
          setProviders(normalized);
        } else {
          setProviders([]);
        }
      })
      .catch(() => setProviders([]));
    return () => {
      mounted = false;
    };
  }, [providerMeta]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
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
        <div className="relative">
          {/* Glass card */}
          <div
            className="bg-white dark:bg-gray-800 bg-opacity-25 dark:bg-opacity-85 backdrop-filter backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-white dark:border-gray-600 border-opacity-30 dark:border-opacity-50 shadow-2xl p-6 sm:p-8 w-full max-w-md sm:max-w-lg"
            aria-busy={loading}
          >
            {/* Subtle inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 dark:from-white/5 to-transparent pointer-events-none"></div>
            {/* Logo and title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden group">
                {/* Decorative inner ring */}
                <div className="absolute inset-2 rounded-2xl bg-white/10 backdrop-blur-sm"></div>
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 group-hover:scale-110 transition-transform duration-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text">
                {t('welcome_back')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                {t('sign_in_to_account')}
              </p>
            </motion.div>

            {/* Login form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Form form={form} onSubmit={handleSubmit} layout="vertical" requiredSymbol={false}>
                <FormItem
                  label={
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      {t('username')}
                    </span>
                  }
                  field="username"
                  rules={[
                    { required: true, message: t('username_required') },
                    { minLength: 3, message: t('username_min_length') },
                  ]}
                >
                  <Input
                    disabled={loading}
                    placeholder={t('enter_username')}
                    size="large"
                    className="bg-white dark:bg-gray-700 bg-opacity-60 dark:bg-opacity-90 border-white dark:border-gray-500 border-opacity-40 dark:border-opacity-60 backdrop-filter backdrop-blur-md rounded-xl text-gray-900 dark:text-gray-100 hover:bg-opacity-70 dark:hover:bg-opacity-95 transition-all duration-300 focus:bg-opacity-80 dark:focus:bg-opacity-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    prefix={
                      <span className="w-5 h-5 flex items-center justify-center">
                        <User className="text-gray-400 dark:text-gray-300" size={20} />
                      </span>
                    }
                  />
                </FormItem>

                <FormItem
                  label={
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      {t('password')}
                    </span>
                  }
                  field="password"
                  rules={[
                    { required: true, message: t('password_required') },
                    { minLength: 6, message: t('password_min_length') },
                  ]}
                >
                  <Input.Password
                    disabled={loading}
                    placeholder={t('enter_password')}
                    size="large"
                    className="bg-white dark:bg-gray-700 bg-opacity-60 dark:bg-opacity-90 border-white dark:border-gray-500 border-opacity-40 dark:border-opacity-60 backdrop-filter backdrop-blur-md rounded-xl text-gray-900 dark:text-gray-100 hover:bg-opacity-70 dark:hover:bg-opacity-95 transition-all duration-300 focus:bg-opacity-80 dark:focus:bg-opacity-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    prefix={
                      <span className="w-5 h-5 flex items-center justify-center">
                        <Lock className="text-gray-400 dark:text-gray-300" size={20} />
                      </span>
                    }
                  />
                </FormItem>

                <FormItem>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={loading}
                      size="large"
                      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 border-none rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-center">
                        {loading ? (
                          <svg
                            className="animate-spin mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <LogIn className="mr-2" size={20} />
                        )}
                        {t('sign_in_button')}
                      </div>
                    </Button>
                  </motion.div>
                </FormItem>
              </Form>
              {providers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-600 border-opacity-30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-gray-500 dark:text-gray-400">
                        {t('or_continue_with', { defaultValue: 'Or continue with' })}
                      </span>
                    </div>
                  </div>

                  {/* OAuth Buttons */}
                  <div className="space-y-2">
                    {providers.map((p, index) => (
                      <motion.div
                        key={p}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      >
                        <button
                          type="button"
                          onClick={() => handleOAuthLogin(p)}
                          disabled={loading}
                          className={`w-full cursor-pointer flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-80 backdrop-filter backdrop-blur-sm hover:bg-opacity-70 dark:hover:bg-opacity-90 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            p === 'github'
                              ? 'hover:border-gray-900 dark:hover:border-gray-100'
                              : p === 'google'
                                ? 'hover:border-blue-300 dark:hover:border-blue-400'
                                : 'hover:border-gray-500 dark:hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 ${
                              p === 'github'
                                ? 'bg-gray-900 text-white group-hover:bg-gray-800 p-1.5'
                                : p === 'google'
                                  ? 'text-white bg-transparent'
                                  : 'bg-gray-600 text-white group-hover:bg-gray-700 p-1.5'
                            }`}
                          >
                            {providerMeta[p].icon}
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300 text-center">
                            {providerMeta[p].label}
                          </span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
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
                  className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors duration-200"
                >
                  {t('sign_up')}
                </button>
              </p>
              <div className="mt-4 pt-4 border-t border-white dark:border-gray-600 border-opacity-30 dark:border-opacity-50">
                <button
                  onClick={() => router.push('/')}
                  className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors duration-200"
                >
                  {t('back_to_home')}
                </button>
              </div>
            </motion.div>
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-neutral-900/10 dark:bg-neutral-900/40 backdrop-blur-glass-lg rounded-3xl" />
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Use custom layout to hide sidebar and header
LoginPage.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};
