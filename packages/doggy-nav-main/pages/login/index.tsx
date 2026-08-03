import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Form, Input, Message } from '@arco-design/web-react';
import { useSetAtom } from 'jotai';
import { ArrowLeft, Fingerprint, LockKeyhole, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { GitHubIcon, GoogleIcon, LinuxDoIcon } from '@/components/OAuthIcons';
import ThemeToggle from '@/components/Buttons/ThemeToggle';
import { authActionsAtom } from '@/store/store';
import type { LoginFormValues, OAuthProvider } from '@/types';
import api from '@/utils/api';
import { setAccessExpEpochMs } from '@/utils/session';
import { getSafeAuthRedirect } from '@/utils/authRedirect';

const FormItem = Form.Item;

export default function LoginPage() {
  const { t } = useTranslation('translation');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const dispatchAuth = useSetAtom(authActionsAtom);
  const router = useRouter();
  const busy = loading || passkeyLoading;

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

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

      await router.replace(getSafeAuthRedirect(router.query.redirect));
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

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      const optionsJSON = await api.beginPasskeyLogin();
      const credential = await startAuthentication({ optionsJSON });
      const { user } = await api.finishPasskeyLogin(credential);
      dispatchAuth({ type: 'LOGIN', payload: { user } });
      Message.success(t('login_successful'));
      await router.replace(getSafeAuthRedirect(router.query.redirect));
    } catch (error: unknown) {
      Message.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message ||
              t('passkey_login_failed', { defaultValue: 'Passkey sign-in failed' })
          : t('passkey_login_failed', { defaultValue: 'Passkey sign-in failed' })
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-theme-background text-theme-foreground lg:flex">
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
          <LanguageSwitcher className="!border-theme-border !bg-transparent" />
          <ThemeToggle className="!border-theme-border !bg-transparent" />
        </div>

        <div className="w-full max-w-[390px]" aria-busy={busy}>
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-theme-muted-foreground transition-colors hover:text-theme-primary lg:hidden"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t('back_to_home').replace('←', '').trim()}
          </Link>

          <div className="mb-9">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-theme-card shadow-sm">
                <Image src="/logo-icon.png" alt="" width={25} height={27} />
              </span>
              <span className="font-semibold tracking-wide">Doggy Nav</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-theme-muted-foreground">
              Doggy Nav
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {t('welcome_back')}
            </h1>
            <p className="mt-3 text-base leading-6 text-theme-muted-foreground">
              {t('sign_in_to_account')}
            </p>
          </div>

          <Form
            form={form}
            onSubmit={handleSubmit}
            layout="vertical"
            requiredSymbol={false}
            disabled={busy}
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
                className="theme-form-input !h-12 !rounded-xl"
                prefix={
                  <UserRound size={18} className="text-theme-muted-foreground" aria-hidden="true" />
                }
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
                className="theme-form-input !h-12 !rounded-xl"
                prefix={
                  <LockKeyhole
                    size={18}
                    className="text-theme-muted-foreground"
                    aria-hidden="true"
                  />
                }
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
                className="!h-12 !rounded-xl !border-theme-primary !bg-theme-primary !font-semibold !text-theme-primary-foreground !shadow-none hover:!opacity-90"
              >
                {loading ? t('signing_in') : t('sign_in_button')}
              </Button>
            </FormItem>
          </Form>

          {passkeySupported ? (
            <div className="mt-7">
              <div className="mb-4 flex items-center gap-4 text-xs text-theme-muted-foreground">
                <span className="h-px flex-1 bg-theme-border" />
                {t('or', { defaultValue: 'Or' })}
                <span className="h-px flex-1 bg-theme-border" />
              </div>
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={busy}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-theme-primary/40 bg-theme-secondary px-4 font-semibold text-theme-secondary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Fingerprint size={20} aria-hidden="true" />
                {passkeyLoading
                  ? t('passkey_signing_in', { defaultValue: 'Waiting for your passkey…' })
                  : t('sign_in_with_passkey', { defaultValue: 'Sign in with a passkey' })}
              </button>
            </div>
          ) : null}

          {providers.length > 0 ? (
            <div className="mt-7">
              <div className="mb-4 flex items-center gap-4 text-xs text-theme-muted-foreground">
                <span className="h-px flex-1 bg-theme-border" />
                {t('or_continue_with', { defaultValue: 'Or continue with' })}
                <span className="h-px flex-1 bg-theme-border" />
              </div>
              <div className="grid gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => {
                      const redirect = getSafeAuthRedirect(router.query.redirect);
                      window.location.assign(
                        `/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`
                      );
                    }}
                    disabled={busy}
                    className="flex h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-theme-border bg-transparent px-4 font-medium transition-colors hover:border-theme-primary hover:bg-theme-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="grid h-5 w-5 place-items-center">
                      {providerMeta[provider].icon}
                    </span>
                    {providerMeta[provider].label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-theme-muted-foreground">
            {t('no_account')}{' '}
            <Link
              href="/register"
              className="font-semibold text-theme-primary underline decoration-theme-border underline-offset-4 hover:decoration-theme-primary"
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
