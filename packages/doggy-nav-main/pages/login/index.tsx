import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Form, Input, Message } from '@arco-design/web-react';
import { useSetAtom } from 'jotai';
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { GitHubIcon, GoogleIcon, LinuxDoIcon } from '@/components/OAuthIcons';
import ThemeToggle from '@/components/Buttons/ThemeToggle';
import { authActionsAtom } from '@/store/store';
import type { LoginFormValues, OAuthProvider } from '@/types';
import api from '@/utils/api';
import { setAccessExpEpochMs } from '@/utils/session';

const FormItem = Form.Item;

export default function LoginPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const dispatchAuth = useSetAtom(authActionsAtom);
  const router = useRouter();

  const providerMeta = useMemo<Record<OAuthProvider, { icon: ReactNode; label: string }>>(
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

  useEffect(() => {
    let mounted = true;
    api
      .getAuthProviders()
      .then((res) => {
        if (!mounted) return;
        const available = Array.isArray(res?.providers)
          ? (res.providers as unknown[]).filter(
              (provider): provider is OAuthProvider =>
                typeof provider === 'string' && provider in providerMeta
            )
          : [];
        setProviders(available);
      })
      .catch(() => setProviders([]));

    return () => {
      mounted = false;
    };
  }, [providerMeta]);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { user } = await api.login(values);
      dispatchAuth({
        type: 'LOGIN',
        payload: { user: { ...user, id: user.id ?? 'admin' } },
      });
      Message.success(t('login_successful'));

      try {
        const me = await api.getCurrentUser();
        if (typeof me.accessExp === 'number') setAccessExpEpochMs(me.accessExp);
      } catch {}

      await router.push((router.query.redirect as string) || '/');
    } catch (error: unknown) {
      Message.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || t('login_failed')
          : t('login_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#f4f0e8] text-[#20231d] dark:bg-[#10120f] dark:text-[#f4f0e8] lg:flex">
      <section className="relative hidden min-h-[100dvh] w-[58%] overflow-hidden lg:block">
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
            Curated for curious minds
          </p>
          <p className="text-3xl font-medium leading-tight">
            Keep the corners of the internet worth returning to.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] flex-1 items-center justify-center px-6 py-20 sm:px-10">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LanguageSwitcher className="!border-[#d8d2c6] !bg-transparent dark:!border-white/15" />
          <ThemeToggle className="!border-[#d8d2c6] !bg-transparent dark:!border-white/15" />
        </div>

        <div className="w-full max-w-[390px]" aria-busy={loading}>
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-[#686c62] transition-colors hover:text-[#273524] dark:text-[#a8aa9f] dark:hover:text-white lg:hidden"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t('back_to_home').replace('←', '').trim()}
          </Link>

          <div className="mb-9">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm">
                <Image src="/logo-icon.png" alt="" width={25} height={27} />
              </span>
              <span className="font-semibold tracking-wide">Doggy Nav</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#747a6d] dark:text-[#9da092]">
              Doggy Nav
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {t('welcome_back')}
            </h1>
            <p className="mt-3 text-base leading-6 text-[#696d64] dark:text-[#a7aa9f]">
              {t('sign_in_to_account')}
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
              ]}
            >
              <Input
                name="username"
                autoComplete="username"
                placeholder={t('enter_username')}
                size="large"
                className="!h-12 !rounded-xl !border-[#d7d1c5] !bg-[#fbfaf7] hover:!border-[#8b927e] dark:!border-white/15 dark:!bg-white/[0.06]"
                prefix={<UserRound size={18} className="text-[#858a7d]" aria-hidden="true" />}
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
                autoComplete="current-password"
                placeholder={t('enter_password')}
                size="large"
                className="!h-12 !rounded-xl !border-[#d7d1c5] !bg-[#fbfaf7] hover:!border-[#8b927e] dark:!border-white/15 dark:!bg-white/[0.06]"
                prefix={<LockKeyhole size={18} className="text-[#858a7d]" aria-hidden="true" />}
              />
            </FormItem>

            <FormItem className="!mb-0 !mt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                loadingFixedWidth
                long
                size="large"
                className="!h-12 !rounded-xl !border-none !bg-[#273524] !font-semibold !shadow-none hover:!bg-[#354632] dark:!bg-[#dce7d5] dark:!text-[#1a2118] dark:hover:!bg-white"
              >
                {loading ? t('signing_in') : t('sign_in_button')}
              </Button>
            </FormItem>
          </Form>

          {providers.length > 0 ? (
            <div className="mt-7">
              <div className="mb-4 flex items-center gap-4 text-xs text-[#85887f]">
                <span className="h-px flex-1 bg-[#d9d3c8] dark:bg-white/15" />
                {t('or_continue_with', { defaultValue: 'Or continue with' })}
                <span className="h-px flex-1 bg-[#d9d3c8] dark:bg-white/15" />
              </div>
              <div className="grid gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => {
                      window.location.href = `/api/auth/${provider}`;
                    }}
                    disabled={loading}
                    className="flex h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#d7d1c5] bg-transparent px-4 font-medium transition-colors hover:border-[#8b927e] hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#273524] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
                  >
                    <span className="grid h-5 w-5 place-items-center">{providerMeta[provider].icon}</span>
                    {providerMeta[provider].label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-[#696d64] dark:text-[#a7aa9f]">
            {t('no_account')}{' '}
            <Link
              href="/register"
              className="font-semibold text-[#273524] underline decoration-[#aeb5a5] underline-offset-4 hover:decoration-[#273524] dark:text-[#dce7d5]"
            >
              {t('sign_up')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return page;
};
