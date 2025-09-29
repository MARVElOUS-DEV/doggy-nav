import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtom, useSetAtom } from 'jotai';
import { authStateAtom, initAuthFromStorageAtom } from '@/store/store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const [authState] = useAtom(authStateAtom);
  const initAuth = useSetAtom(initAuthFromStorageAtom);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!authState.isAuthenticated && router.isReady) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`;
      router.push(redirectUrl);
    }
  }, [authState.isAuthenticated, router, redirectTo]);

  if (!authState.isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}