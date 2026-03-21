import React from "react";

/* ── CSS injected once ── */
const SKELETON_CSS = `
.rd-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.rd-skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(47, 107, 255, 0.04) 25%,
    rgba(47, 107, 255, 0.09) 50%,
    rgba(47, 107, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: rd-shimmer 1.8s ease-in-out infinite;
}

/* stagger width so lines look natural */
.rd-skeleton-line:nth-child(1)  { width: 72%; }
.rd-skeleton-line:nth-child(2)  { width: 88%; }
.rd-skeleton-line:nth-child(3)  { width: 60%; }
.rd-skeleton-line:nth-child(4)  { width: 80%; }
.rd-skeleton-line:nth-child(5)  { width: 50%; }
.rd-skeleton-line:nth-child(6)  { width: 75%; }
.rd-skeleton-line:nth-child(7)  { width: 65%; }
.rd-skeleton-line:nth-child(8)  { width: 82%; }
.rd-skeleton-line:nth-child(9)  { width: 55%; }
.rd-skeleton-line:nth-child(10) { width: 70%; }

@keyframes rd-shimmer {
  0%   { background-position:  200% 0; }
  100% { background-position: -200% 0; }
}
`;

function useSkeletonStyles() {
  React.useEffect(() => {
    const id = "rd-skeleton-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = SKELETON_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

type Props = { lines?: number };

export default function SkeletonLoader({ lines = 6 }: Props) {
  useSkeletonStyles();

  return (
    <div className="rd-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="rd-skeleton-line" />
      ))}
    </div>
  );
}