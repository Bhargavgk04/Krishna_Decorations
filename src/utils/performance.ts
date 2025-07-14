// Throttle a function using requestAnimationFrame
export function rafThrottle<T extends (...args: unknown[]) => void>(fn: T): T {
  let scheduled = false;
  let lastArgs: unknown[];

  const wrapper = (...args: unknown[]) => {
    lastArgs = args;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        fn(...lastArgs);
      });
    }
  };

  return wrapper as T;
} 