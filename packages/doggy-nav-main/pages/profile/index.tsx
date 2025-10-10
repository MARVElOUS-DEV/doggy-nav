'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Message, Upload, Avatar } from '@arco-design/web-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AuthGuard from '@/components/AuthGuard';
import { authStateAtom, authActionsAtom } from '@/store/store';
import api from '@/utils/api';

const FormItem = Form.Item;

function ProfileContent() {
  const [form] = Form.useForm();
  const authState = useAtomValue(authStateAtom);
  const dispatchAuth = useSetAtom(authActionsAtom);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const user = authState.user!;

  useEffect(() => {
    user.username && form.setFieldsValue({
      username: user.username,
      email: user.email || '',
    });
  }, [user, form]);

  const handleSubmit = async (values: { username: string; email: string }) => {
    setLoading(true);
    try {
      const updatedUser = await api.updateProfile(values);

      Message.success('Profile updated successfully!');

      // Update local user state with the response data
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: updatedUser,
          token: authState.token!,
        },
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      // Error message is already shown by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Avatar = await base64Promise;

      // Upload to server
      const updatedUser = await api.updateProfile({ avatar: base64Avatar });

      // Update local user state with the response data
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: updatedUser,
          token: authState.token!,
        },
      });

      Message.success('Avatar updated successfully!');
      return { url: base64Avatar };
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      // Error message is already shown by axios interceptor
      throw error;
    } finally {
      setUploadLoading(false);
    }
  };

  const getAvatarText = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColors = (username: string): string => {
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-orange-500 to-orange-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card
          className="profile-card shadow-xl rounded-2xl border border-theme-border transition-colors"
          style={{
            background: 'color-mix(in srgb, var(--color-card) 92%, transparent)',
            backdropFilter: 'blur(16px) saturate(140%)'
          }}
        >
          <div className="p-6">
            <h1 className="text-2xl font-bold text-theme-foreground mb-6 transition-colors">Profile Settings</h1>
            
            {/* Avatar Section */}
            <div className="flex items-center mb-8 pb-6 border-b border-theme-border transition-colors">
              <div className="mr-6">
                {user.avatar ? (
                  <Avatar size={80} className="shadow-lg">
                    <Image
                      src={user.avatar}
                      alt="Avatar"
                      width={80}
                      height={80}
                      style={{ borderRadius: '50%' }}
                    />
                  </Avatar>
                ) : (
                  <div
                    className={`${getAvatarColors(user.username)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                    style={{ width: 80, height: 80, fontSize: 32 }}
                  >
                    {getAvatarText(user.username)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme-foreground mb-2 transition-colors">{user.username}</h3>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={async ({ file }) => {
                    await handleAvatarUpload(file as File);
                  }}
                >
                  <Button type="secondary" size="small" loading={uploadLoading}>
                    Change Avatar
                  </Button>
                </Upload>
              </div>
            </div>

            {/* Profile Form */}
            <Form
              form={form}
              onSubmit={handleSubmit}
              layout="vertical"
              requiredSymbol={false}
            >
              <FormItem
                label={<span className="text-theme-foreground font-medium transition-colors">Username</span>}
                field="username"
                disabled
                rules={[
                  { required: true, message: 'Please enter your username' },
                  { minLength: 3, message: 'Username must be at least 3 characters' }
                ]}
              >
                <Input
                  placeholder="Enter your username"
                  size="large"
                  className="profile-input rounded-xl"
                />
              </FormItem>

              <FormItem
                label={<span className="text-theme-foreground font-medium transition-colors">Email</span>}
                field="email"
                disabled={!!user.email}
                rules={[
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input
                  placeholder="Enter your email (optional)"
                  size="large"
                  className="profile-input rounded-xl"
                />
              </FormItem>

              <FormItem hidden={!!user.email}>
                <div className="flex gap-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none rounded-xl font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                  <Button
                    type="secondary" 
                    onClick={() => form.resetFields(['email'])}
                    className="rounded-xl"
                  >
                    Reset
                  </Button>
                </div>
              </FormItem>
            </Form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-primary) 70%, transparent)',
                borderTopColor: 'transparent'
              }}
            ></div>
            <p className="text-theme-muted-foreground transition-colors">Loading...</p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </AuthGuard>
  );
}