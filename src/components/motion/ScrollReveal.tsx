'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './ScrollReveal.module.css';

interface MotionBaseProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  rootMargin?: string;
}

type MotionStyle = CSSProperties & { '--motion-delay'?: string };

function useMotionVisibility(rootMargin: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    setReady(true);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin });

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, ready, visible };
}

export function MotionReveal({ children, className = '', delay = 0, rootMargin = '0px 0px -8% 0px' }: MotionBaseProps) {
  const { ref, ready, visible } = useMotionVisibility(rootMargin);
  const motionStyle: MotionStyle = { '--motion-delay': `${delay}ms` };

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${ready ? styles.ready : ''} ${visible ? styles.visible : ''} ${className}`}
      style={motionStyle}
    >
      {children}
    </div>
  );
}

export function MotionGroup({ children, className = '', delay = 0, rootMargin = '0px 0px -8% 0px' }: MotionBaseProps) {
  const { ref, ready, visible } = useMotionVisibility(rootMargin);
  const motionStyle: MotionStyle = { '--motion-delay': `${delay}ms` };

  return (
    <div
      ref={ref}
      className={`${styles.group} ${ready ? styles.ready : ''} ${visible ? styles.visible : ''} ${className}`}
      style={motionStyle}
    >
      {children}
    </div>
  );
}
