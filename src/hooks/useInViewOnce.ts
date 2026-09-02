import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Becomes true the first time `ref` enters the viewport (with rootMargin).
 * Used to defer GPS / heavy work until the section is near the screen.
 */
export function useInViewOnce<T extends Element>(
  rootMargin = '200px 0px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}
