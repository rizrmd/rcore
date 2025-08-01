import { useEffect, useRef, useState } from "react";

export const useLocal = <T extends Record<string, any>>(
  value: T,
  effect?: () => void
) => {
  const local = useRef(value).current;
  const render = useState({})[1];
  (local as any).render = () => render({});

  useEffect(() => {
    effect?.();
  }, []);

  return local as T & { render: () => void };
};
