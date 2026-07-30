import { useEffect, useState, type ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Form, Input, Message } from '@arco-design/web-react';
import { ArrowLeft, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/Buttons/ThemeToggle';
import type { RegisterFormValues } from '@/types';
import api from '@/utils/api';

const FormItem = Form.Item;
const inputClass = 'theme-form-input !h-11 !rounded-xl';
const iconClass = 'text-theme-muted-foreground';

export default function RegisterPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requireInvite, setRequireInvite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .getAuthConfig()
      .then((config) => setRequireInvite(Boolean(config.requireInviteForLocalRegister)))
      .catch(() => setRequireInvite(false));
  }, []);

  const handleSubmit = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      Message.error(t('password_mismatch'));
      return;
    }

    setLoading(true);
    try {
      const payload = requireInvite ? values : { ...values, inviteCode: undefined };
      const { user } = await api.register(payload);
      if (user.username) {
        Message.success(t('registration_successful'));
        await router.push('/login');
      }
    } catch (error: unknown) {
      Message.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || t('registration_failed')
          : t('registration_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-theme-background text-theme-foreground lg:flex">
      <section className="sticky top-0 hidden h-[100dvh] w-[58%] overflow-hidden lg:block">
        <Image
          src="/login-editorial.webp"
          alt="A golden retriever resting in a quiet reading room"
          fill
          priority
          sizes="58vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />

        <Link
          href="/"
          className="absolute left-10 top-9 flex items-center gap-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={t('back_to_home')}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white">
            <Image src="/logo-icon.png" alt="" width={25} height={27} />
          </span>
          <span className="text-base font-semibold tracking-wide">Doggy Nav</span>
        </Link>

        <div className="absolute bottom-12 left-10 max-w-md text-white">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
            A better way to wander
          </p>
          <p className="text-3xl font-medium leading-tight">
            Save what matters. Find it again when it does.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] flex-1 items-center justify-center px-6 py-16 sm:px-10">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LanguageSwitcher className="!border-theme-border !bg-transparent" />
          <ThemeToggle className="!border-theme-border !bg-transparent" />
        </div>

        <div className="w-full max-w-[390px]" aria-busy={loading}>
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-theme-muted-foreground transition-colors hover:text-theme-primary lg:hidden"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t('back_to_home').replace('←', '').trim()}
          </Link>

          <div className="mb-7">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-theme-card shadow-sm">
                <Image src="/logo-icon.png" alt="" width={25} height={27} />
              </span>
              <span className="font-semibold tracking-wide">Doggy Nav</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-theme-muted-foreground">
              Doggy Nav
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {t('join_doggy_nav')}
            </h1>
            <p className="mt-3 text-base leading-6 text-theme-muted-foreground">
              {t('create_account')}
            </p>
          </div>

          <Form
            form={form}
            onSubmit={handleSubmit}
            layout="vertical"
            requiredSymbol={false}
            disabled={loading}
            autoComplete="on"
          >
            <FormItem
              label={<span className="font-medium">{t('username')}</span>}
              field="username"
              rules={[
                { required: true, message: t('username_required') },
                { minLength: 3, message: t('username_min_length') },
                { maxLength: 20, message: t('username_max_length') },
              ]}
            >
              <Input
                name="username"
                autoComplete="username"
                placeholder={t('enter_username')}
                size="large"
                className={inputClass}
                prefix={<UserRound size={18} className={iconClass} aria-hidden="true" />}
              />
            </FormItem>

            <FormItem
              label={<span className="font-medium">{t('email')}</span>}
              field="email"
              rules={[
                { required: true, message: t('email_required') },
                { type: 'email', message: t('email_invalid') },
              ]}
            >
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('enter_email')}
                size="large"
                className={inputClass}
                prefix={<Mail size={18} className={iconClass} aria-hidden="true" />}
              />
            </FormItem>

            <FormItem
              label={<span className="font-medium">{t('password')}</span>}
              field="password"
              rules={[
                { required: true, message: t('password_required') },
                { minLength: 6, message: t('password_min_length') },
              ]}
            >
              <Input.Password
                name="password"
                autoComplete="new-password"
                placeholder={t('enter_password')}
                size="large"
                className={inputClass}
                prefix={<LockKeyhole size={18} className={iconClass} aria-hidden="true" />}
              />
            </FormItem>

            <FormItem
              label={<span className="font-medium">{t('confirm_password')}</span>}
              field="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('confirm_password_required') },
                {
                  validator: (value, callback) => {
                    if (value && value !== form.getFieldValue('password')) {
                      callback(t('password_mismatch'));
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <Input.Password
                name="confirmPassword"
                autoComplete="new-password"
                placeholder={t('enter_confirm_password')}
                size="large"
                className={inputClass}
                prefix={<LockKeyhole size={18} className={iconClass} aria-hidden="true" />}
              />
            </FormItem>

            {requireInvite ? (
              <FormItem
                label={<span className="font-medium">{t('invite_code')}</span>}
                field="inviteCode"
                rules={[{ required: true, message: t('invite_code_required') }]}
              >
                <Input
                  name="inviteCode"
                  autoComplete="off"
                  placeholder={t('enter_invite_code')}
                  size="large"
                  className={inputClass}
                  prefix={<KeyRound size={18} className={iconClass} aria-hidden="true" />}
                />
              </FormItem>
            ) : null}

            <FormItem className="!mb-0 !mt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                loadingFixedWidth
                long
                size="large"
                className="!h-12 !rounded-xl !border-theme-primary !bg-theme-primary !font-semibold !text-theme-primary-foreground !shadow-none hover:!opacity-90"
              >
                {loading ? t('creating_account') : t('create_account_button')}
              </Button>
            </FormItem>
          </Form>

          <p className="mt-7 text-center text-sm text-theme-muted-foreground">
            {t('already_have_account')}{' '}
            <Link
              href="/login"
              className="font-semibold text-theme-primary underline decoration-theme-border underline-offset-4 hover:decoration-theme-primary"
            >
              {t('sign_in_link')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

RegisterPage.getLayout = function getLayout(page: ReactElement) {
  return page;
};
