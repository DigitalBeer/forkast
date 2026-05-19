interface FilterDefsProps {
  intensity?: number;
}

export function FilterDefs({ intensity = 0.5 }: FilterDefsProps) {
  const scale = (intensity * 2.4).toFixed(2);
  const scaleStrong = (intensity * 4).toFixed(2);
  const freq = (0.018 + intensity * 0.012).toFixed(3);

  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale={scale} />
        </filter>
        <filter id="wobble-strong" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale={scaleStrong} />
        </filter>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" />
          <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.6  0 0 0 0.18 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
    </svg>
  );
}
