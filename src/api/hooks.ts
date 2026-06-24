import { useState, useEffect, useCallback, useRef } from "react";

export function useApiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result = await fetcher();
      if (!controller.signal.aborted) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (options?.enabled === false) return;
    fetch();
    return () => { abortRef.current?.abort(); };
  }, [fetch, options?.enabled]);

  useEffect(() => {
    if (!options?.refetchInterval) return;
    const id = setInterval(fetch, options.refetchInterval);
    return () => clearInterval(id);
  }, [fetch, options?.refetchInterval]);

  return { data, error, loading, refetch: fetch };
}

export function useApiMutation<TInput = any, TOutput = any>(
  mutator: (input: TInput) => Promise<TOutput>,
  options?: { onSuccess?: (result: TOutput, input: TInput) => void; onError?: (e: Error) => void },
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (input: TInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(input);
      options?.onSuccess?.(result, input);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { mutate, loading, error };
}
