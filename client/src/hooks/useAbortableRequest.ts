import { useRef } from 'react';

export function useAbortableRequest() {
  const abortRef = useRef<AbortController | null>(null);

  const abort = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const create = () => {
    abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };

  return { abort, create };
}
