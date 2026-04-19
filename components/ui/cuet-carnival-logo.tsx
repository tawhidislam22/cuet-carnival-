"use client";

import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
};

export function CuetCarnivalLogo({ size = 32, className }: Props) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CUET Carnival logo"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="64" height="64" rx="14" fill={`url(#${gradId})`} />

      {/* Mortarboard diamond top */}
      <polygon points="32,8 48,16.5 32,21.5 16,16.5" fill="white" />

      {/* Cap brim */}
      <rect x="22" y="20.5" width="20" height="4.5" rx="2" fill="rgba(255,255,255,0.85)" />

      {/* Tassel cord */}
      <line x1="48" y1="16.5" x2="48" y2="28" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Tassel ball */}
      <circle cx="48" cy="31" r="3.5" fill="#fbbf24" />

      {/* Confetti dots */}
      <circle cx="10" cy="10" r="2.5" fill="#fbbf24" />
      <circle cx="54" cy="9"  r="2"   fill="#34d399" />
      <circle cx="55" cy="52" r="2.5" fill="#fbbf24" />
      <circle cx="9"  cy="53" r="2"   fill="#34d399" />

      {/* 4-point star sparkle */}
      <path
        d="M15.5,30 L17,26 L18.5,30 L22,30 L19,32.5 L20,37 L17,34.5 L14,37 L15,32.5 L12,30 Z"
        fill="#fbbf24"
        opacity="0.9"
      />

      {/* Small diamond sparkle top-right */}
      <path d="M53,22 L54.5,25 L53,28 L51.5,25 Z" fill="white" opacity="0.6" />

      {/* CC monogram */}
      <text
        x="32"
        y="56"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="14"
        fontWeight="bold"
        fill="white"
        letterSpacing="2"
      >
        CC
      </text>
    </svg>
  );
}
