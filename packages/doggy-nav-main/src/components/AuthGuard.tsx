import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue, useSetAtom } from 'jotai';
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
  const initAuth = useSetAtom(initAuthFromStorageAtom);
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (authState.initialized && !authState.isAuthenticated && router.isReady) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`;
      router.push(redirectUrl);
    }
  }, [authState.initialized, authState.isAuthenticated, router, redirectTo]);

  if (!authState.initialized || !authState.isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}