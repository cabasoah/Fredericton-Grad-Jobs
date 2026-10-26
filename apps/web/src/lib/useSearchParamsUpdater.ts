import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// Updates URL search params without losing changes made in quick
// succession. React Router's setSearchParams(prev => ...) passes the params
// from the last render, so two updates before a re-render (e.g. two selects
// changed back to back, or a select change racing a debounced text write)
// would drop one of them. This builds each update on the latest params
// requested, falling back to the URL once it has re-rendered.
export const useSearchParamsUpdater = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const latest = useRef(searchParams);

  useEffect(() => {
    latest.current = searchParams;
  }, [searchParams]);

  return useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => {
      const next = new URLSearchParams(latest.current);
      mutate(next);
      if (next.toString() === latest.current.toString()) return;
      latest.current = next;
      setSearchParams(next, options);
    },
    [setSearchParams],
  );
};
