'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, Message, Upload, Popconfirm } from '@arco-design/web-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Camera, Fingerprint, KeyRound, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import AuthGuard from '@/components/AuthGuard';
import { authStateAtom, authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import type { Passkey } from '@/types';
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
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);

  const user = authState.user!;

  useEffect(() => {
    user.username &&
      form.setFieldsValue({
        username: user.username,
        email: user.email || '',
      });
  }, [user, form]);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
    api
      .getPasskeys()
      .then(setPasskeys)
      .catch(() => setPasskeys([]));
  }, []);

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
      Message.success(
        t('password_change_success', { defaultValue: 'Password updated successfully!' })
      );
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('Password update failed:', error);
      Message.error(
        error?.message || t('password_change_failed', { defaultValue: 'Failed to update password' })
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

  const handleAddPasskey = async () => {
    setPasskeyLoading(true);
    try {
      const optionsJSON = await api.beginPasskeyRegistration();
      const credential = await startRegistration({ optionsJSON });
      await api.finishPasskeyRegistration(credential);
      setPasskeys(await api.getPasskeys());
      Message.success(t('passkey_added', { defaultValue: 'Passkey added' }));
    } catch (error: any) {
      Message.error(
        error?.message || t('passkey_add_failed', { defaultValue: 'Could not add passkey' })
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      await api.deletePasskey(id);
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
      Message.success(t('passkey_deleted', { defaultValue: 'Passkey removed' }));
    } catch {
      Message.error(t('passkey_delete_failed', { defaultValue: 'Could not remove passkey' }));
    }
  };

  const getAvatarText = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColors = (username: string): string => {
    const hash = username.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
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
    <main className="min-h-full bg-[#f6f3ec] px-4 py-10 text-[#242820] dark:bg-[#11130f] dark:text-[#f4f0e8] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#687061] dark:text-[#a5aa9c]">
            Doggy Nav
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t('profile_settings')}
          </h1>
          <p className="mt-3 text-base leading-7 text-[#686d63] dark:text-[#a8ab9f]">
            {t('profile_intro')}
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"
        >
          <aside className="overflow-hidden rounded-[1.75rem] bg-[#304638] text-white shadow-[0_24px_70px_rgba(38,51,42,0.18)] lg:sticky lg:top-8">
            <div className="p-7 sm:p-8">
              <div className="mb-7 flex items-center gap-5 lg:block">
                <div className="relative w-fit lg:mb-6">
                  {user.avatar ? (
                    <div className="h-24 w-24 overflow-hidden rounded-[1.75rem] bg-white/10 ring-4 ring-white/10 lg:h-28 lg:w-28">
                      <Image
                        src={user.avatar}
                        alt={`${user.username}'s avatar`}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`${getAvatarColors(user.username)} flex h-24 w-24 items-center justify-center rounded-[1.75rem] text-3xl font-semibold text-white ring-4 ring-white/10 lg:h-28 lg:w-28 lg:text-4xl`}
                    >
                      {getAvatarText(user.username)}
                    </div>
                  )}
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={async ({ file }) => {
                      await handleAvatarUpload(file as File);
                    }}
                  >
                    <Button
                      iconOnly
                      loading={uploadLoading}
                      icon={<Camera size={17} aria-hidden="true" />}
                      aria-label={t('change_avatar')}
                      className="!absolute !-bottom-2 !-right-2 !h-10 !w-10 !rounded-xl !border-0 !bg-white !text-[#304638] !shadow-lg"
                    />
                  </Upload>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold tracking-[-0.03em]">
                    {user.username}
                  </h2>
                  <p className="mt-1 truncate text-sm text-white/65">
                    {user.email || t('email_not_added')}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/15 pt-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#d9e8d6]" size={20} />
                  <div>
                    <p className="font-medium">{t('security')}</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">{t('security_summary')}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-[#ddd8cc] bg-[#fffdf9] p-6 shadow-[0_18px_55px_rgba(49,54,45,0.07)] dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8ede5] text-[#304638] dark:bg-white/10 dark:text-[#dce8d8]">
                  <UserRound size={21} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em]">
                    {t('personal_information')}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#74786f] dark:text-[#a8ab9f]">
                    {t('personal_information_description')}
                  </p>
                </div>
              </div>

              <Form
                form={form}
                onSubmit={handleSubmit}
                layout="vertical"
                requiredSymbol={false}
                className="grid gap-x-5 md:grid-cols-2"
              >
                <FormItem
                  label={<span className="font-medium">{t('username')}</span>}
                  field="username"
                  disabled
                  rules={[
                    { required: true, message: t('username_required') },
                    { minLength: 3, message: t('username_min_length') },
                  ]}
                >
                  <Input
                    placeholder={t('enter_username')}
                    size="large"
                    prefix={<UserRound size={17} className="text-[#858a7d]" aria-hidden="true" />}
                    className="!h-12 !rounded-xl !border-[#d8d3c8] !bg-[#f8f6f1] dark:!border-white/10 dark:!bg-white/[0.04]"
                  />
                </FormItem>

                <FormItem
                  label={<span className="font-medium">{t('email')}</span>}
                  field="email"
                  disabled={!!user.email}
                  rules={[{ type: 'email', message: t('email_invalid') }]}
                >
                  <Input
                    placeholder={t('enter_email_optional')}
                    size="large"
                    prefix={<Mail size={17} className="text-[#858a7d]" aria-hidden="true" />}
                    className="!h-12 !rounded-xl !border-[#d8d3c8] !bg-[#f8f6f1] dark:!border-white/10 dark:!bg-white/[0.04]"
                  />
                </FormItem>

                <FormItem hidden={!!user.email} className="md:col-span-2 !mb-0">
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="!h-11 !rounded-xl !border-[#304638] !bg-[#304638] !px-6 !font-medium hover:!border-[#3d5847] hover:!bg-[#3d5847]"
                    >
                      {loading ? t('updating') : t('update_profile')}
                    </Button>
                    <Button
                      type="secondary"
                      onClick={() => form.resetFields(['email'])}
                      className="!h-11 !rounded-xl !border-[#d8d3c8] !bg-transparent !px-6 dark:!border-white/15"
                    >
                      {t('reset')}
                    </Button>
                  </div>
                </FormItem>
              </Form>
            </section>

            <section className="rounded-[1.75rem] border border-[#ddd8cc] bg-[#fffdf9] p-6 shadow-[0_18px_55px_rgba(49,54,45,0.07)] dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8ede5] text-[#304638] dark:bg-white/10 dark:text-[#dce8d8]">
                    <Fingerprint size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.025em]">
                      {t('passkeys', { defaultValue: 'Passkeys' })}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-[#74786f] dark:text-[#a8ab9f]">
                      {t('passkeys_description', {
                        defaultValue:
                          'Use your fingerprint, face, or device PIN to sign in without a password.',
                      })}
                    </p>
                  </div>
                </div>
                {passkeySupported ? (
                  <Button
                    type="primary"
                    icon={<Fingerprint size={17} aria-hidden="true" />}
                    loading={passkeyLoading}
                    onClick={handleAddPasskey}
                    className="!inline-flex !h-11 shrink-0 !items-center !justify-center !rounded-xl !border-[#304638] !bg-[#304638] !px-5 hover:!border-[#3d5847] hover:!bg-[#3d5847]"
                  >
                    {passkeyLoading
                      ? t('adding_passkey', { defaultValue: 'Waiting for your device…' })
                      : t('add_passkey', { defaultValue: 'Add a passkey' })}
                  </Button>
                ) : null}
              </div>

              <div className="mt-7 grid gap-3">
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className="flex items-center gap-4 rounded-2xl border border-[#e2ded4] bg-[#faf8f3] p-4 dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8ede5] text-[#304638] dark:bg-white/10 dark:text-[#dce8d8]">
                      <KeyRound size={19} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{passkey.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[#777c72] dark:text-[#a8ab9f]">
                        {t('added_on', {
                          defaultValue: 'Added {{date}}',
                          date: new Date(passkey.createdAt).toLocaleDateString(),
                        })}
                        {passkey.lastUsedAt
                          ? ` · ${t('last_used_on', {
                              defaultValue: 'Last used {{date}}',
                              date: new Date(passkey.lastUsedAt).toLocaleDateString(),
                            })}`
                          : ''}
                      </p>
                    </div>
                    <Popconfirm
                      title={t('remove_passkey', {
                        defaultValue: 'Remove this passkey?',
                      })}
                      onOk={() => handleDeletePasskey(passkey.id)}
                    >
                      <Button
                        type="text"
                        status="danger"
                        iconOnly
                        icon={<Trash2 size={17} aria-hidden="true" />}
                        className="!rounded-xl"
                        aria-label={t('remove_passkey', {
                          defaultValue: 'Remove this passkey',
                        })}
                      />
                    </Popconfirm>
                  </div>
                ))}
                {passkeys.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8d3c8] bg-[#faf8f3] px-5 py-7 text-center dark:border-white/15 dark:bg-white/[0.025]">
                    <Fingerprint
                      size={24}
                      className="mx-auto mb-3 text-[#8d9386]"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-[#74786f] dark:text-[#a8ab9f]">
                      {t('no_passkeys', { defaultValue: 'No passkeys added yet.' })}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-[#ddd8cc] bg-[#fffdf9] p-6 shadow-[0_18px_55px_rgba(49,54,45,0.07)] dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8ede5] text-[#304638] dark:bg-white/10 dark:text-[#dce8d8]">
                  <KeyRound size={21} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em]">
                    {t('change_password', { defaultValue: 'Change Password' })}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#74786f] dark:text-[#a8ab9f]">
                    {t('password_description')}
                  </p>
                </div>
              </div>

              <Form
                form={passwordForm}
                onSubmit={handlePasswordSubmit}
                layout="vertical"
                requiredSymbol={false}
                className="grid gap-x-5 md:grid-cols-2"
              >
                <FormItem
                  label={
                    <span className="font-medium">
                      {t('current_password', { defaultValue: 'Current Password' })}
                    </span>
                  }
                  field="currentPassword"
                  className="md:col-span-2"
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
                    prefix={<KeyRound size={17} className="text-[#858a7d]" aria-hidden="true" />}
                    className="!h-12 !rounded-xl !border-[#d8d3c8] !bg-[#f8f6f1] dark:!border-white/10 dark:!bg-white/[0.04]"
                  />
                </FormItem>

                <FormItem
                  label={
                    <span className="font-medium">
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
                    className="!h-12 !rounded-xl !border-[#d8d3c8] !bg-[#f8f6f1] dark:!border-white/10 dark:!bg-white/[0.04]"
                  />
                </FormItem>

                <FormItem
                  label={
                    <span className="font-medium">
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
                    className="!h-12 !rounded-xl !border-[#d8d3c8] !bg-[#f8f6f1] dark:!border-white/10 dark:!bg-white/[0.04]"
                  />
                </FormItem>

                <FormItem className="md:col-span-2 !mb-0">
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={passwordLoading}
                      className="!h-11 !rounded-xl !border-[#304638] !bg-[#304638] !px-6 !font-medium hover:!border-[#3d5847] hover:!bg-[#3d5847]"
                    >
                      {passwordLoading
                        ? t('updating', { defaultValue: 'Updating...' })
                        : t('change_password', { defaultValue: 'Change Password' })}
                    </Button>
                    <Button
                      type="secondary"
                      onClick={() => passwordForm.resetFields()}
                      className="!h-11 !rounded-xl !border-[#d8d3c8] !bg-transparent !px-6 dark:!border-white/15"
                    >
                      {t('reset')}
                    </Button>
                  </div>
                </FormItem>
              </Form>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
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
                borderTopColor: 'transparent',
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
