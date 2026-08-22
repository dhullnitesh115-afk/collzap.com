/**
 * useAsyncData Hook
 * -----------------
 * A reusable hook for any screen that fetches data from Supabase or another
 * async source. It manages three states together: loading, error, and data.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAsyncData(async () => {
 *     return await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
 *   }, [userId]);
 *
 * The hook returns skeleton-ready loading state, a user-facing error, and a
 * refetch function so screens can retry on failure.
 */

import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState({ data: null, loading: false, error: message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}
