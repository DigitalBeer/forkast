export type DoodleKind =
  | 'tomato' | 'egg' | 'fish' | 'leaf' | 'bread' | 'avocado'
  | 'noodles' | 'bowl' | 'pizza' | 'mushroom' | 'pancake' | 'salad'
  | 'taco' | 'soup' | 'shrimp' | 'burger' | 'cheese';

interface DoodleProps {
  kind: DoodleKind;
  size?: number;
  stroke?: number;
  className?: string;
}

export function Doodle({ kind, size = 56, stroke = 1.6, className }: DoodleProps) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 56 56',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (kind) {
    case 'tomato':
      return (
        <svg {...svgProps}>
          <circle cx="28" cy="32" r="14" fill="rgba(168,50,50,0.18)" />
          <circle cx="28" cy="32" r="14" />
          <path d="M22 18 L28 22 L34 18 M28 22 L28 18" stroke="#1f5f3f" />
        </svg>
      );
    case 'egg':
      return (
        <svg {...svgProps}>
          <ellipse cx="28" cy="30" rx="12" ry="16" fill="rgba(232,184,66,0.18)" />
          <ellipse cx="28" cy="30" rx="12" ry="16" />
        </svg>
      );
    case 'fish':
      return (
        <svg {...svgProps}>
          <ellipse cx="24" cy="28" rx="14" ry="8" fill="rgba(168,50,50,0.14)" />
          <ellipse cx="24" cy="28" rx="14" ry="8" />
          <path d="M38 28 L48 22 L48 34 Z" fill="rgba(168,50,50,0.14)" />
          <path d="M38 28 L48 22 L48 34 Z" />
          <circle cx="20" cy="26" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...svgProps}>
          <ellipse cx="28" cy="28" rx="9" ry="18" transform="rotate(35 28 28)" fill="rgba(31,95,63,0.18)" />
          <ellipse cx="28" cy="28" rx="9" ry="18" transform="rotate(35 28 28)" />
          <line x1="20" y1="36" x2="36" y2="20" />
        </svg>
      );
    case 'bread':
      return (
        <svg {...svgProps}>
          <rect x="10" y="18" width="36" height="22" rx="10" fill="rgba(232,184,66,0.22)" />
          <rect x="10" y="18" width="36" height="22" rx="10" />
          <line x1="18" y1="24" x2="22" y2="34" />
          <line x1="26" y1="24" x2="30" y2="34" />
          <line x1="34" y1="24" x2="38" y2="34" />
        </svg>
      );
    case 'avocado':
      return (
        <svg {...svgProps}>
          <ellipse cx="28" cy="30" rx="11" ry="16" fill="rgba(31,95,63,0.18)" />
          <ellipse cx="28" cy="30" rx="11" ry="16" />
          <circle cx="28" cy="34" r="5" fill="rgba(168,50,50,0.4)" />
        </svg>
      );
    case 'noodles':
      return (
        <svg {...svgProps}>
          <circle cx="28" cy="32" r="14" fill="rgba(232,184,66,0.18)" />
          <circle cx="28" cy="32" r="14" />
          <path d="M18 28 Q22 24 26 28 T34 28 T42 28" />
          <path d="M18 32 Q22 36 26 32 T34 32 T42 32" />
          <path d="M18 36 Q22 32 26 36 T34 36 T42 36" />
        </svg>
      );
    case 'bowl':
      return (
        <svg {...svgProps}>
          <path d="M10 24 Q28 20 46 24 L42 40 Q28 46 14 40 Z" fill="rgba(31,95,63,0.14)" />
          <path d="M10 24 Q28 20 46 24 L42 40 Q28 46 14 40 Z" />
          <line x1="14" y1="26" x2="42" y2="26" />
        </svg>
      );
    case 'pizza':
      return (
        <svg {...svgProps}>
          <path d="M28 8 L48 44 L8 44 Z" fill="rgba(232,184,66,0.22)" />
          <path d="M28 8 L48 44 L8 44 Z" />
          <circle cx="22" cy="32" r="2" fill="#a83232" />
          <circle cx="32" cy="28" r="2" fill="#a83232" />
          <circle cx="34" cy="38" r="2" fill="#a83232" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg {...svgProps}>
          <path d="M14 28 Q14 16 28 16 Q42 16 42 28 Z" fill="rgba(168,50,50,0.18)" />
          <path d="M14 28 Q14 16 28 16 Q42 16 42 28 Z" />
          <rect x="22" y="28" width="12" height="14" rx="2" fill="rgba(232,184,66,0.18)" />
          <rect x="22" y="28" width="12" height="14" rx="2" />
        </svg>
      );
    case 'pancake':
      return (
        <svg {...svgProps}>
          <ellipse cx="28" cy="34" rx="16" ry="5" fill="rgba(232,184,66,0.22)" />
          <ellipse cx="28" cy="34" rx="16" ry="5" />
          <ellipse cx="28" cy="29" rx="16" ry="5" />
          <ellipse cx="28" cy="24" rx="16" ry="5" />
          <path d="M22 19 Q28 14 34 19" stroke="#c79420" />
        </svg>
      );
    case 'salad':
      return (
        <svg {...svgProps}>
          <path d="M10 28 Q28 20 46 28 L42 42 Q28 48 14 42 Z" fill="rgba(31,95,63,0.18)" />
          <path d="M10 28 Q28 20 46 28 L42 42 Q28 48 14 42 Z" />
          <circle cx="22" cy="28" r="3" fill="#a83232" opacity="0.7" />
          <circle cx="34" cy="30" r="2.5" fill="#e8b842" opacity="0.8" />
        </svg>
      );
    case 'taco':
      return (
        <svg {...svgProps}>
          <path d="M8 38 Q28 14 48 38" fill="rgba(232,184,66,0.25)" />
          <path d="M8 38 Q28 14 48 38" />
          <path d="M8 38 Q28 32 48 38" />
          <circle cx="20" cy="32" r="2" fill="#a83232" />
          <circle cx="34" cy="30" r="2" fill="#1f5f3f" />
        </svg>
      );
    case 'shrimp':
      return (
        <svg {...svgProps}>
          <path
            d="M14 30 Q14 18 28 18 Q44 18 42 32 Q40 42 28 40 Q18 38 14 30 Z"
            fill="rgba(168,50,50,0.2)"
          />
          <path d="M14 30 Q14 18 28 18 Q44 18 42 32 Q40 42 28 40 Q18 38 14 30 Z" />
          <circle cx="40" cy="22" r="1.4" fill="currentColor" />
        </svg>
      );
    case 'soup':
      return (
        <svg {...svgProps}>
          <ellipse cx="28" cy="24" rx="18" ry="3" />
          <path d="M10 24 L14 42 Q28 46 42 42 L46 24" fill="rgba(232,184,66,0.22)" />
          <path d="M10 24 L14 42 Q28 46 42 42 L46 24" />
          <path d="M22 12 Q24 16 22 20 M30 10 Q32 14 30 18" stroke="#5a4a3a" />
        </svg>
      );
    case 'burger':
      return (
        <svg {...svgProps}>
          <path d="M10 22 Q28 14 46 22 L42 26 L14 26 Z" fill="rgba(232,184,66,0.3)" />
          <path d="M10 22 Q28 14 46 22 L42 26 L14 26 Z" />
          <rect x="14" y="26" width="28" height="4" fill="#1f5f3f" opacity="0.6" />
          <rect x="12" y="30" width="32" height="6" fill="#a83232" opacity="0.6" />
          <path d="M10 36 Q28 44 46 36 L42 40 L14 40 Z" fill="rgba(232,184,66,0.3)" />
          <path d="M10 36 Q28 44 46 36 L42 40 L14 40 Z" />
        </svg>
      );
    case 'cheese':
      return (
        <svg {...svgProps}>
          <path d="M8 38 L26 18 L48 30 L48 42 L8 42 Z" fill="rgba(232,184,66,0.3)" />
          <path d="M8 38 L26 18 L48 30 L48 42 L8 42 Z" />
          <circle cx="22" cy="32" r="1.5" />
          <circle cx="34" cy="34" r="1.5" />
          <circle cx="40" cy="38" r="1" />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <circle cx="28" cy="28" r="14" fill="rgba(232,184,66,0.18)" />
          <circle cx="28" cy="28" r="14" />
        </svg>
      );
  }
}

/** Map a meal name to a sensible doodle kind. */
export function guessDoodleKind(mealName: string): DoodleKind {
  const lower = mealName.toLowerCase();
  if (/risotto|pasta|noodle|spaghetti|linguine/.test(lower)) return 'noodles';
  if (/salad/.test(lower)) return 'salad';
  if (/soup|chowder|bisque/.test(lower)) return 'soup';
  if (/pizza/.test(lower)) return 'pizza';
  if (/taco|burrito|wrap|fajita/.test(lower)) return 'taco';
  if (/burger/.test(lower)) return 'burger';
  if (/pancake|waffle|crepe/.test(lower)) return 'pancake';
  if (/bread|toast|sandwich|club/.test(lower)) return 'bread';
  if (/fish|salmon|tuna|cod|prawn|shrimp/.test(lower)) return 'fish';
  if (/egg|omelette|frittata/.test(lower)) return 'egg';
  if (/avocado/.test(lower)) return 'avocado';
  if (/mushroom/.test(lower)) return 'mushroom';
  if (/tomato/.test(lower)) return 'tomato';
  if (/cheese/.test(lower)) return 'cheese';
  if (/curry|stew|pie|casserole|lasagna/.test(lower)) return 'bowl';
  return 'bowl';
}
