import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface UseAsyncPageDataOptions<T> {
  initialData: T;
  load: () => Promise<T>;
  getErrorMessage: (error: unknown) => string;
}

interface AsyncPageDataResult<T> {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAsyncPageData<T>({
  initialData,
  load,
  getErrorMessage,
}: UseAsyncPageDataOptions<T>): AsyncPageDataResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const mountedRef = useRef(false);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const execute = useCallback(
    async (background: boolean, isActive: () => boolean) => {
      if (!isActive()) return;
      const request = ++requestRef.current;
      if (background) setRefreshing(true);
      else setLoading(true);
      setError(undefined);

      try {
        const result = await load();
        if (isActive() && request === requestRef.current) setData(result);
      } catch (requestError) {
        if (isActive() && request === requestRef.current) setError(getErrorMessage(requestError));
      } finally {
        if (isActive() && request === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [getErrorMessage, load],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void execute(false, () => active && mountedRef.current);
    });
    return () => {
      active = false;
    };
  }, [execute]);

  const reload = useCallback(() => execute(false, () => mountedRef.current), [execute]);
  const refresh = useCallback(() => execute(true, () => mountedRef.current), [execute]);

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  };
}
