import React from 'react';

interface MoonProps {
 phaseType: string;
 size?: number;
 showGlow?: boolean;
}

const CRATERS_DATA: readonly [number, number, number][] = [
  [40, 35, 4.2],
  [62, 45, 5.2],
  [45, 65, 6.2],
  [34, 52, 3.7],
  [58, 28, 4.7],
  [32, 30, 1.8],
  [68, 60, 2.2],
  [50, 55, 2.7],
];

export const MoonRenderer: React.FC<MoonProps> = ({
 phaseType,
 size = 60,
 showGlow = true,
}) => {
 // Glow colors
 const uId = React.useId().replace(/:/g, '');
 const glowId = `moon-glow-${phaseType}-${uId}`;
 const craterGradId = `crater-grad-${phaseType}-${uId}`;

 // We design 8 custom high-fidelity SVG views for maximum visual appeal and performance stability
 // Standard moon size dimensions: centered around (50, 50), radius 38
 const radius = 38;
 const cx = 50;
 const cy = 50;

 // Render atmospheric outer glow if requested
 const glowFilter = showGlow ? (
 <defs>
 <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
 <feGaussianBlur stdDeviation="4" result="blur" />
 <feComposite in="SourceGraphic" in2="blur" operator="over" />
 </filter>
 <radialGradient id={craterGradId} cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#d8d4c5" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#9a9584" stopOpacity="0.7" />
 </radialGradient>
 </defs>
 ) : null;

 // Render stylized background craters (unlit or slightly visible in "earthshine")
 const renderCraters = (opacity: number = 0.15) => (
 <g opacity={opacity} fill="#111827">
 <circle cx={40} cy={35} r={4} />
 <circle cx={42} cy={37} r={2} />
 <circle cx={62} cy={45} r={5} />
 <circle cx={64} cy={43} r={3} />
 <circle cx={45} cy={65} r={6} />
 <circle cx={48} cy={68} r={3} />
 <circle cx={34} cy={52} r={3.5} />
 <circle cx={58} cy={28} r={4.5} />
 {/* Small details */}
 <circle cx={32} cy={30} r={1.5} />
 <circle cx={68} cy={60} r={2} />
 <circle cx={50} cy={55} r={2.5} />
 </g>
 );

 // Lit craters (very warm and visible on illuminated parts)
 const renderLitCraters = (maskId?: string) => {
 const isWaning = phaseType.startsWith('waning') || phaseType === 'last-quarter';
 const gradId = isWaning ? `url(#crater-grad-waning-${uId})` : `url(#crater-grad-waxing-${uId})`;
 const filterId = isWaning ? `url(#crater-shadow-waning-${uId})` : `url(#crater-shadow-waxing-${uId})`;

 return (
 <g mask={maskId ? `url(#${maskId}-${uId})` : undefined}>
 {CRATERS_DATA.map(([cx, cy, r], i) => {
 const dx = isWaning ? 0.7 : -0.7;
 const dy = 0.7;
 return (
 <g key={i}>
 {/* Highlight Rim */}
 <circle cx={cx - dx} cy={cy - dy} r={r} fill="#fffdec" opacity={0.8} />
 {/* Dark Shadow Cavity */}
 <circle cx={cx + dx} cy={cy + dy} r={r} fill="#433d2f" opacity={0.75} />
 {/* Main Crater Surface Blend */}
 <circle cx={cx} cy={cy} r={r * 0.95} fill={gradId} filter={filterId} opacity={0.9} />
 </g>
 );
 })}
 </g>
 );
 };

 // Return specific SVG paths based on phase type
 const renderPhaseSVG = () => {
 switch (phaseType) {
 case 'new-moon':
 return (
 <>
 {/* Dark Sphere with subtle outline */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#dark-moon-grad-${uId})`} className="stroke-slate-800/50 stroke-1" />
 {renderCraters(0.12)}
 {/* Subtle atmospheric ring / Earthshine */}
 <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 4" opacity={0.25} />
 </>
 );

 case 'waxing-crescent': // Büyüyen Hilal (Glow on the right side)
 return (
 <>
 <defs>
 <mask id={`waxing-crescent-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 {/* Outermost circle */}
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 {/* Shading subtracting circle shifted leftwards */}
 <circle cx={cx - 18} cy={cy} r={radius + 2} fill="black" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.1)}
 
 {/* Illuminated Crescent */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#waxing-crescent-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('waxing-crescent-mask')}
 </>
 );

 case 'first-quarter': // İlk Dördün (Right half is lit)
 return (
 <>
 <defs>
 <mask id={`first-quarter-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 {/* Lit half */}
 <rect x="50" y="0" width="50" height="100" fill="white" />
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 <rect x="0" y="0" width="50" height="100" fill="black" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.15)}

 {/* Lit half */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#first-quarter-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('first-quarter-mask')}
 </>
 );

 case 'waxing-gibbous': // Büyüyen Şişkin Ay (Right 3/4 lit)
 return (
 <>
 <defs>
 <mask id={`waxing-gibbous-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 {/* Base circle to show */}
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 {/* Subtract a sliver on the left */}
 <path d="M 50 12 A 20 38 0 0 0 50 88 A 38 38 0 0 0 50 12" fill="white" />
 <rect x="0" y="0" width="50" height="100" fill="black" />
 <ellipse cx={50} cy={50} rx={16} ry={38} fill="white" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.1)}

 {/* Lit portion */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#waxing-gibbous-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('waxing-gibbous-mask')}
 </>
 );

 case 'full-moon': // Dolunay (Fully lit)
 return (
 <>
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters()}
 </>
 );

 case 'waning-gibbous': // Küçülen Şişkin Ay (Left 3/4 lit)
 return (
 <>
 <defs>
 <mask id={`waning-gibbous-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 <rect x="50" y="0" width="50" height="100" fill="black" />
 <ellipse cx={50} cy={50} rx={16} ry={38} fill="white" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.1)}

 {/* Lit portion */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#waning-gibbous-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('waning-gibbous-mask')}
 </>
 );

 case 'last-quarter': // Son Dördün (Left half is lit)
 return (
 <>
 <defs>
 <mask id={`last-quarter-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 {/* Lit half */}
 <rect x="0" y="0" width="50" height="100" fill="white" />
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 <rect x="50" y="0" width="50" height="100" fill="black" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.15)}

 {/* Lit half */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#last-quarter-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('last-quarter-mask')}
 </>
 );

 case 'waning-crescent': // Küçülen Hilal (Glow on the left side)
 return (
 <>
 <defs>
 <mask id={`waning-crescent-mask-${uId}`}>
 <rect x="0" y="0" width="100" height="100" fill="black" />
 {/* Outermost circle */}
 <circle cx={cx} cy={cy} r={radius} fill="white" />
 {/* Shading subtracting circle shifted rightwards */}
 <circle cx={cx + 18} cy={cy} r={radius + 2} fill="black" />
 </mask>
 </defs>
 {/* Base Dark Sphere */}
 <circle cx={cx} cy={cy} r={radius} fill="#121824" />
 {renderCraters(0.1)}

 {/* Lit crescent */}
 <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} mask={`url(#waning-crescent-mask-${uId})`} filter={showGlow ? `url(#${glowId})` : undefined} />
 {renderLitCraters('waning-crescent-mask')}
 </>
 );

 default:
 return <circle cx={cx} cy={cy} r={radius} fill={`url(#lit-moon-grad-${uId})`} />;
 }
 };

 return (
 <svg
 width={size}
 height={size}
 viewBox="0 0 100 100"
 className="select-none flex-shrink-0"
 >
 <defs>
 {/* Dynamic Glowing Filter */}
 {glowFilter}

 {/* 3D Crater Shadow/Highlight Filters */}
 <filter id={`crater-shadow-waxing-${uId}`} x="-30%" y="-30%" width="160%" height="160%">
 <feDropShadow dx="-0.4" dy="0.4" stdDeviation="0.3" floodColor="#3a3424" floodOpacity="0.75" />
 </filter>
 <filter id={`crater-shadow-waning-${uId}`} x="-30%" y="-30%" width="160%" height="160%">
 <feDropShadow dx="0.4" dy="0.4" stdDeviation="0.3" floodColor="#3a3424" floodOpacity="0.75" />
 </filter>
 
 {/* Crater gradients */}
 <linearGradient id={`crater-grad-waxing-${uId}`} x1="100%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#7e765f" />
 <stop offset="60%" stopColor="#bcae8d" />
 <stop offset="100%" stopColor="#ebd7a6" />
 </linearGradient>
 <linearGradient id={`crater-grad-waning-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#7e765f" />
 <stop offset="60%" stopColor="#bcae8d" />
 <stop offset="100%" stopColor="#ebd7a6" />
 </linearGradient>

 {/* Lit side of the moon: beautiful warm silver-gold gradient */}
 <radialGradient id={`lit-moon-grad-${uId}`} cx="40%" cy="40%" r="55%">
 <stop offset="0%" stopColor="#fffae8" />
 <stop offset="65%" stopColor="#f3e6bd" />
 <stop offset="90%" stopColor="#cfbc8e" />
 <stop offset="100%" stopColor="#9a8556" />
 </radialGradient>

 {/* Unlit side of the moon: subtle deep purple-blue space-slate */}
 <radialGradient id={`dark-moon-grad-${uId}`} cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#1e293b" />
 <stop offset="70%" stopColor="#0f172a" />
 <stop offset="100%" stopColor="#020617" />
 </radialGradient>
 </defs>

 {renderPhaseSVG()}
 </svg>
 );
};
