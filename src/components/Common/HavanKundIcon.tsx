import React from 'react';

interface HavanKundIconProps {
  status?: 'empty' | 'partial' | 'full' | 'blocked' | 'selected';
  className?: string;
  size?: number | string;
  showFlame?: boolean;
}

/**
 * Traditional Vedic Havan Kund (Sacred Fire Pit) Line Diagram.
 * Depicts the classic multi-tiered stepped trapezoid (mekhala)
 * with the sacred sacrificial flame rising from the pit.
 */
export const HavanKundIcon: React.FC<HavanKundIconProps> = ({
  status = 'empty',
  className = '',
  size = 28,
  showFlame = true,
}) => {
  // Color configuration based on status
  let strokeColor = '#10b981'; // empty: emerald
  let flameFill = '#f59e0b';
  let flameStroke = '#d97706';
  let tierFill = 'none';

  if (status === 'blocked') {
    strokeColor = '#9333ea'; // purple
    flameFill = '#a855f7';
    flameStroke = '#7e22ce';
    tierFill = 'rgba(147, 51, 234, 0.08)';
  } else if (status === 'full') {
    strokeColor = '#e11d48'; // crimson / rose
    flameFill = '#e11d48';
    flameStroke = '#be123c';
    tierFill = 'rgba(225, 29, 72, 0.12)';
  } else if (status === 'partial') {
    strokeColor = '#f59e0b'; // amber
    flameFill = '#fbbf24';
    flameStroke = '#d97706';
    tierFill = 'rgba(245, 158, 11, 0.12)';
  } else if (status === 'selected') {
    strokeColor = '#f59e0b';
    flameFill = '#fbbf24';
    flameStroke = '#b45309';
    tierFill = 'rgba(245, 158, 11, 0.2)';
  } else {
    // empty: soft clean sacred green / neutral
    strokeColor = '#059669';
    flameFill = 'none';
    flameStroke = '#10b981';
    tierFill = 'rgba(5, 150, 105, 0.04)';
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Tier 1 (Top Flat Rim - Upper Mekhala) */}
      <path
        d="M3 13H29"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Outer Stepped Altar Profile (Mekhala Tier 2) */}
      <path
        d="M4.5 13L6.5 20H25.5L27.5 13"
        stroke={strokeColor}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={tierFill}
      />

      {/* Inner Stepped Pit Base (Nabhi / Bottom Tier) */}
      <path
        d="M8.5 20L10.5 26.5H21.5L23.5 20"
        stroke={strokeColor}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={tierFill}
      />

      {/* Bottom Foundation Stand Line */}
      <path
        d="M9.5 27.5H22.5"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Central Sacred Yagya Agni Flame */}
      {showFlame && (
        <g>
          {/* Main rising flame */}
          <path
            d="M16 2.5C13.5 6 12 8.5 13 11.5C13.8 14 16 15 16 15C16 15 18.2 14 19 11.5C20 8.5 18.5 6 16 2.5Z"
            fill={flameFill}
            fillOpacity={status === 'empty' ? 0.3 : 0.85}
            stroke={flameStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Inner golden flame spark */}
          {(status === 'partial' || status === 'full' || status === 'selected') && (
            <path
              d="M16 7.5C15 9.5 14.5 11 15 12.5C15.4 13.5 16 14 16 14C16 14 16.6 13.5 17 12.5C17.5 11 17 9.5 16 7.5Z"
              fill="#fef08a"
              fillOpacity={0.9}
            />
          )}
        </g>
      )}
    </svg>
  );
};
