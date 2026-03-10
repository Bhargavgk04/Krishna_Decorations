import { useState, useEffect } from 'react';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const encodeImagePath = (src: string): string => {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  const match = src.match(/([^?#]*)([?#].*)?/);
  const path = match?.[1] ?? src;
  const suffix = match?.[2] ?? '';
  const hasLeadingSlash = path.startsWith('/');
  const encodedPath = path
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const leading = hasLeadingSlash ? '/' : '';
  const base = (import.meta as any)?.env?.BASE_URL || '/';
  const normalizedBase = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base);
  const isFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
  if (isFile) {
    // Use relative path for file:// to avoid root resolution issues
    return `${encodedPath}${suffix}`;
  }
  return `${normalizedBase}${leading}${encodedPath}${suffix}`;
};

export const useImageLoader = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const attemptLoad = (candidateSrcs: string[]) => {
      const tryNext = () => {
        const next = candidateSrcs.shift();
        if (!next) {
          if (!cancelled) setHasError(true);
          return;
        }
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          setIsLoaded(true);
          setImageSrc(next);
        };
        img.onerror = () => {
          if (cancelled) return;
          tryNext();
        };
        img.src = next;
      };
      tryNext();
    };

    const encoded = encodeImagePath(src);
    const raw = src;
    const spaceToPct = src.replace(/ /g, '%20');
    attemptLoad([encoded, raw, spaceToPct]);

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { isLoaded, hasError, imageSrc };
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  const promises = imageUrls.map(url => preloadImage(url));
  await Promise.allSettled(promises);
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    observer.observe(ref);

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [ref, callback, options]);

  return setRef;
}; 