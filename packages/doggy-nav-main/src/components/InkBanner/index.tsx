import { useId } from 'react';
import styles from './InkBanner.module.css';

export type InkBannerProps = {
  lines: [string, string];
  brand?: string;
  className?: string;
  /** Accessible label; defaults to joined lines + brand. */
  title?: string;
};

function buildAriaLabel(lines: [string, string], brand?: string, title?: string) {
  if (title) return title;
  return [lines[0], lines[1], brand].filter(Boolean).join(' ');
}

/** Thin, wide ink wash banner — tuned for footer strips. */
export default function InkBanner({ lines, brand, className, title }: InkBannerProps) {
  const reactId = useId().replace(/:/g, '');
  const ids = {
    wash: `ink-banner-wash-${reactId}`,
    sheen: `ink-banner-sheen-${reactId}`,
    turnWash: `ink-banner-turn-wash-${reactId}`,
    jade: `ink-banner-jade-${reactId}`,
    amber: `ink-banner-amber-${reactId}`,
    clip: `ink-banner-clip-${reactId}`,
  };
  const ariaLabel = buildAriaLabel(lines, brand, title);
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1100 38"
      role="img"
      aria-label={ariaLabel}
      className={rootClassName}
    >
      <defs>
        <linearGradient id={ids.wash} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--ink-banner-paper)" />
          <stop offset=".56" stopColor="var(--ink-banner-paper-deep)" />
          <stop offset="1" stopColor="var(--ink-banner-paper)" />
        </linearGradient>
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--ink-banner-sheen)" stopOpacity="0" />
          <stop offset=".45" stopColor="var(--ink-banner-sheen)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--ink-banner-sheen)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.turnWash} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--ink-banner-sheen)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--ink-banner-sheen)" stopOpacity=".24" />
          <stop offset="1" stopColor="var(--ink-banner-sheen)" stopOpacity="0" />
        </linearGradient>
        <radialGradient
          id={ids.jade}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(220 19) rotate(8) scale(280 28)"
        >
          <stop offset="0" stopColor="var(--ink-banner-accent)" stopOpacity=".14" />
          <stop offset="1" stopColor="var(--ink-banner-accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={ids.amber}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(860 22) rotate(-6) scale(300 30)"
        >
          <stop offset="0" stopColor="var(--ink-banner-muted)" stopOpacity=".11" />
          <stop offset="1" stopColor="var(--ink-banner-muted)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={ids.clip}>
          <rect x="2" y="2" width="1096" height="34" rx="6" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${ids.clip})`}>
        <rect x="2" y="2" width="1096" height="34" fill={`url(#${ids.wash})`} />
        <ellipse
          cx="220"
          cy="19"
          rx="280"
          ry="28"
          fill={`url(#${ids.jade})`}
          className={styles.soft}
        />
        <ellipse
          cx="860"
          cy="22"
          rx="300"
          ry="30"
          fill={`url(#${ids.amber})`}
          className={styles.soft}
        />
        <rect
          x="-120"
          y="2"
          width="100"
          height="34"
          fill={`url(#${ids.sheen})`}
          className={styles.sweep}
        />
        <rect
          x="480"
          y="8"
          width="140"
          height="18"
          rx="4"
          fill={`url(#${ids.turnWash})`}
          className={styles.turn}
        />
        <path
          d="M48 20C140 10 260 11 360 19C480 28 600 29 720 18C840 8 960 10 1052 20"
          className={styles.rule}
        />
        <path
          d="M72 26C180 32 300 30 400 24C540 16 680 17 820 25C920 31 1000 30 1060 24"
          className={`${styles.rule} ${styles.rule2}`}
        />
      </g>

      <rect x="2" y="2" width="1096" height="34" rx="6" className={styles.frame} />
      <path d="M28 2H120M980 36H1072" className={styles.frameAccent} />

      <g textAnchor="middle">
        <text x="550" y="18" className={`${styles.line} ${styles.lineOne}`}>
          {lines[0]}
        </text>
        <text x="550" y="18" className={`${styles.line} ${styles.lineTwo}`}>
          {lines[1]}
        </text>
        {brand ? (
          <>
            <path d="M470 29H520M580 29H630" className={styles.brandRule} />
            <text x="550" y="32" className={styles.brand}>
              {brand}
            </text>
          </>
        ) : null}
      </g>
    </svg>
  );
}
