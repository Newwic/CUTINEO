'use client';

import styles from './HomepageV2.module.css';

export default function HomepageScrollMotion() {
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
