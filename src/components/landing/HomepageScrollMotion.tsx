'use client';

import type { RefObject } from 'react';
import { useHomepageScrollAnimations } from '../../hooks/useHomepageScrollAnimations';
import styles from './HomepageV2.module.css';

interface HomepageScrollMotionProps {
  rootRef: RefObject<HTMLElement | null>;
}

export default function HomepageScrollMotion({ rootRef }: HomepageScrollMotionProps) {
  useHomepageScrollAnimations(rootRef);

  return (
    <div
      className={styles.globalProgress}
      data-scroll-progress
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span />
    </div>
  );
}
