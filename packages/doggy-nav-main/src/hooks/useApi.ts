import React, { useState, useCallback } from 'react';
import { Message } from '@arco-design/web-react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showSuccessMessage?: string;
}

interface UseApiReturn<T, P extends any[] = any[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...params: P) => Promise<T | void>;
  reset: () => void;
}

export function useApi<T, P extends any[] = any[]>(
  apiFunction: (...params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const apiFunctionRef = React.useRef(apiFunction);
  const optionsRef = React.useRef(options);

  const execute = useCallback(
    async (...params: P): Promise<T | void> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunctionRef.current(...params);
        setData(result);

        if (optionsRef.current.onSuccess) {
          optionsRef.current.onSuccess(result);
        }

        if (optionsRef.current.showSuccessMessage && typeof window !== 'undefined') {
          Message.success(optionsRef.current.showSuccessMessage);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(error);
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Hook for immediate API calls on component mount
export function useApiEffect<T>(
  apiFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseApiOptions<T> = {}
): Omit<UseApiReturn<T, []>, 'execute'> {
  const { data, loading, error, execute, reset } = useApi(apiFunction, options);

  React.useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reset };
}

export default useApi;