import React from 'react';

interface PaperPageProps {
  children: React.ReactNode;
  foldSize?: number;
  className?: string;
}

const HOLE_PUNCHES = [180, 700, 1220];

export function PaperPage({ children, foldSize = 88, className }: PaperPageProps) {
  const FOLD = foldSize;

  return (
    <div
      className={className}
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255,235,200,0.45) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 90%, rgba(0,0,0,0.12) 0%, transparent 60%),
          repeating-linear-gradient(92deg,
            #d4a574 0px, #d4a574 22px,
            #cfa06a 22px, #cfa06a 26px,
            #d4a574 26px, #d4a574 80px,
            #c89764 80px, #c89764 84px),
          #d4a574
        `,
        padding: '40px',
        position: 'relative',
        fontFamily: 'var(--font-lora), serif',
      }}
    >
      {/* Desk props: coffee ring */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 56,
          width: 90,
          height: 90,
          borderRadius: '50%',
          border: '4px solid rgba(110,70,40,0.24)',
          boxShadow: 'inset 0 0 5px rgba(110,70,40,0.14)',
          transform: 'rotate(-8deg)',
          zIndex: 0,
          filter: 'url(#wobble)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: 72,
          width: 65,
          height: 65,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(110,70,40,0.14) 0%, transparent 60%)',
          transform: 'rotate(-8deg)',
          zIndex: 0,
        }}
      />

      {/* Page shadow */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 40,
          right: 40,
          bottom: 40,
          background: 'rgba(60,40,20,0.18)',
          filter: 'blur(14px)',
          transform: 'translate(6px, 10px)',
          zIndex: 0,
        }}
      />

      {/* The paper page */}
      <div
        style={{
          position: 'relative',
          background: 'var(--forkast-paper, #fdf6ec)',
          clipPath: `polygon(
            0 0,
            calc(100% - ${FOLD}px) 0,
            100% ${FOLD}px,
            100% 100%,
            0 100%
          )`,
          minHeight: '600px',
          boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
          zIndex: 1,
        }}
      >
        {/* Paper tints for aged warmth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            pointerEvents: 'none',
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(120,80,40,0.06) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(120,80,40,0.05) 0%, transparent 50%)
            `,
          }}
        />

        {/* Grain texture */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            mixBlendMode: 'multiply',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <rect width="100%" height="100%" filter="url(#paper-grain)" fill="white" />
        </svg>

        {/* Red ruled margin */}
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--forkast-crimson, #a83232)',
            opacity: 0.55,
            filter: 'url(#wobble)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 116,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--forkast-crimson, #a83232)',
            opacity: 0.25,
          }}
        />

        {/* Hole-punches */}
        {HOLE_PUNCHES.map((y) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: 38,
              top: y,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#e8d4a0',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
            }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            padding: '44px 70px 60px 150px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {children}
        </div>
      </div>

      {/* Dog-ear (top-right fold) */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 40,
          width: FOLD,
          height: FOLD,
          clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
          background: `linear-gradient(135deg, var(--forkast-paper-deep, #f4e9cf) 0%, var(--forkast-paper-shadow, #d8c89a) 100%)`,
          boxShadow: 'inset 4px -4px 8px rgba(0,0,0,0.18)',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 40 + FOLD - 2,
          top: 40,
          width: 30,
          height: FOLD,
          background: 'linear-gradient(225deg, rgba(0,0,0,0.18), transparent 60%)',
          clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}
