import { useState } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import type { RegisterFormValues } from '@/types';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

export default function RegisterPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [, dispatchAuth] = useAtom(authActionsAtom);
  const router = useRouter();

  const handleSubmit = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      Message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { user: {username} } = await api.register(values);
      if(username){
        Message.success('Registration successful! You may login now.');
        router.push('/login');
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        Message.error((error as { message?: string }).message || 'Registration failed');
      } else {
        Message.error('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
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
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg backdrop-saturate-150 rounded-2xl border border-white border-opacity-30 shadow-2xl p-8 w-full max-w-md">
          {/* Logo and title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Join Doggy Nav</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </motion.div>

          {/* Register form */}
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
                label={<span className="text-gray-700 font-medium">Username</span>}
                field="username"
                rules={[
                  { required: true, message: 'Please enter your username' },
                  { minLength: 3, message: 'Username must be at least 3 characters' },
                  { maxLength: 20, message: 'Username must be at most 20 characters' }
                ]}
              >
                <Input
                  placeholder="Enter your username"
                  size="large"
                  className="bg-white bg-opacity-50 border-white border-opacity-30 backdrop-filter backdrop-blur-sm rounded-xl"
                  prefix={<i className="iconfont icon-user text-gray-400"></i>}
                />
              </FormItem>

              <FormItem
                label={<span className="text-gray-700 font-medium">Email</span>}
                field="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input
                  placeholder="Enter your email"
                  size="large"
                  className="bg-white bg-opacity-50 border-white border-opacity-30 backdrop-filter backdrop-blur-sm rounded-xl"
                  prefix={<i className="iconfont icon-email text-gray-400"></i>}
                />
              </FormItem>

              <FormItem
                label={<span className="text-gray-700 font-medium">Password</span>}
                field="password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { minLength: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password
                  placeholder="Enter your password"
                  size="large"
                  className="bg-white bg-opacity-50 border-white border-opacity-30 backdrop-filter backdrop-blur-sm rounded-xl"
                  prefix={<i className="iconfont icon-lock text-gray-400"></i>}
                />
              </FormItem>

              <FormItem
                label={<span className="text-gray-700 font-medium">Confirm Password</span>}
                field="confirmPassword"
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  {
                    validator: (value, callback) => {
                      const password = form.getFieldValue('password');
                      if (value && value !== password) {
                        callback('Passwords do not match');
                      } else {
                        callback();
                      }
                    }
                  }
                ]}
              >
                <Input.Password
                  placeholder="Confirm your password"
                  size="large"
                  className="bg-white bg-opacity-50 border-white border-opacity-30 backdrop-filter backdrop-blur-sm rounded-xl"
                  prefix={<i className="iconfont icon-lock text-gray-400"></i>}
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
                  {loading ? 'Creating Account...' : 'Create Account'}
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
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
            <div className="mt-4 pt-4 border-t border-white border-opacity-30">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
              >
                ← Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Use custom layout to hide sidebar and header
RegisterPage.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};