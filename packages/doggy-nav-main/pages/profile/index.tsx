'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Message, Upload, Avatar } from '@arco-design/web-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AuthGuard from '@/components/AuthGuard';
import { authStateAtom, authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

function ProfileContent() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const authState = useAtomValue(authStateAtom);
  const dispatchAuth = useSetAtom(authActionsAtom);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
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

      Message.success(t('profile_updated_success'));

      // Update local user state with the response data
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: updatedUser,
        },
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      Message.error(t('profile_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      Message.error(t('password_mismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      Message.success(t('password_change_success', { defaultValue: 'Password updated successfully!' }));
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('Password update failed:', error);
      Message.error(
        error?.message ||
          t('password_change_failed', { defaultValue: 'Failed to update password' })
      );
    } finally {
      setPasswordLoading(false);
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
        },
      });

      Message.success(t('avatar_updated_success'));
      return { url: base64Avatar };
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      Message.error(t('avatar_upload_failed'));
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
            <h1 className="text-2xl font-bold text-theme-foreground mb-6 transition-colors">{t('profile_settings')}</h1>

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
                    {t('change_avatar')}
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
                label={<span className="text-theme-foreground font-medium transition-colors">{t('username')}</span>}
                field="username"
                disabled
                rules={[
                  { required: true, message: t('username_required') },
                  { minLength: 3, message: t('username_min_length') }
                ]}
              >
                <Input
                  placeholder={t('enter_username')}
                  size="large"
                  className="profile-input rounded-xl"
                />
              </FormItem>

              <FormItem
                label={<span className="text-theme-foreground font-medium transition-colors">{t('email')}</span>}
                field="email"
                disabled={!!user.email}
                rules={[
                  { type: 'email', message: t('email_invalid') }
                ]}
              >
                <Input
                  placeholder={t('enter_email_optional')}
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
                    {loading ? t('updating') : t('update_profile')}
                  </Button>
                  <Button
                    type="secondary"
                    onClick={() => form.resetFields(['email'])}
                    className="rounded-xl"
                  >
                    {t('reset')}
                  </Button>
                </div>
              </FormItem>
            </Form>

            {/* Password Change Form */}
            <div className="mt-10 pt-6 border-t border-theme-border transition-colors">
              <h2 className="text-xl font-semibold text-theme-foreground mb-4 transition-colors">
                {t('change_password', { defaultValue: 'Change Password' })}
              </h2>
              <Form
                form={passwordForm}
                onSubmit={handlePasswordSubmit}
                layout="vertical"
                requiredSymbol={false}
              >
                <FormItem
                  label={
                    <span className="text-theme-foreground font-medium transition-colors">
                      {t('current_password', { defaultValue: 'Current Password' })}
                    </span>
                  }
                  field="currentPassword"
                  rules={[
                    {
                      required: true,
                      message: t('current_password_required', {
                        defaultValue: 'Please enter your current password',
                      }),
                    },
                  ]}
                >
                  <Input.Password
                    placeholder={t('enter_current_password', {
                      defaultValue: 'Enter your current password',
                    })}
                    size="large"
                    className="profile-input rounded-xl"
                  />
                </FormItem>

                <FormItem
                  label={
                    <span className="text-theme-foreground font-medium transition-colors">
                      {t('new_password', { defaultValue: 'New Password' })}
                    </span>
                  }
                  field="newPassword"
                  rules={[
                    {
                      required: true,
                      message: t('new_password_required', {
                        defaultValue: 'Please enter a new password',
                      }),
                    },
                    {
                      minLength: 6,
                      message: t('password_min_length'),
                    },
                  ]}
                >
                  <Input.Password
                    placeholder={t('enter_new_password', {
                      defaultValue: 'Enter your new password',
                    })}
                    size="large"
                    className="profile-input rounded-xl"
                  />
                </FormItem>

                <FormItem
                  label={
                    <span className="text-theme-foreground font-medium transition-colors">
                      {t('confirm_new_password', { defaultValue: 'Confirm New Password' })}
                    </span>
                  }
                  field="confirmPassword"
                  rules={[
                    {
                      required: true,
                      message: t('confirm_new_password_required', {
                        defaultValue: 'Please confirm your new password',
                      }),
                    },
                    {
                      validator: (value, callback) => {
                        const newPassword = passwordForm.getFieldValue('newPassword');
                        if (value && value !== newPassword) {
                          callback(t('password_mismatch'));
                        } else {
                          callback();
                        }
                      },
                    },
                  ]}
                >
                  <Input.Password
                    placeholder={t('enter_confirm_new_password', {
                      defaultValue: 'Confirm your new password',
                    })}
                    size="large"
                    className="profile-input rounded-xl"
                  />
                </FormItem>

                <FormItem>
                  <div className="flex gap-4">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={passwordLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none rounded-xl font-medium"
                    >
                      {passwordLoading
                        ? t('updating', { defaultValue: 'Updating...' })
                        : t('change_password', { defaultValue: 'Change Password' })}
                    </Button>
                    <Button
                      type="secondary"
                      onClick={() => passwordForm.resetFields()}
                      className="rounded-xl"
                    >
                      {t('reset')}
                    </Button>
                  </div>
                </FormItem>
              </Form>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation('translation');

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
            <p className="text-theme-muted-foreground transition-colors">{t('loading')}</p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </AuthGuard>
  );
}