import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
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
  const [, initAuth] = useAtom(initAuthFromStorageAtom);

  useEffect(() => {
    // Initialize auth state from localStorage first
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!authState.isAuthenticated && router.isReady) {
      // Add current path as redirect parameter
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`;
      router.push(redirectUrl);
    }
  }, [authState.isAuthenticated, router, redirectTo]);

  // Show fallback while checking authentication
  if (!authState.isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}