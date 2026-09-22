"use client";

interface MorphixLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

function MorphixIcon({ id = "mx" }: { id?: string }) {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7B2FFF" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7B2FFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF2FD4" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Right dark face */}
      <polygon points="50,4 84,44 50,66 50,4" fill="#0d0520" opacity="0.95" />
      {/* Left bright face */}
      <polygon points="50,4 16,44 50,66 50,4" fill={`url(#${id}-top)`} />
      {/* Bottom left face */}
      <polygon points="16,44 50,66 50,126 16,44" fill={`url(#${id}-left)`} />
      {/* Bottom right face */}
      <polygon points="84,44 50,66 50,126 84,44" fill="#08080F" opacity="0.95" />
      {/* Edge highlights */}
      <line x1="50" y1="4" x2="16" y2="44" stroke="#00F0FF" strokeWidth="1.5" opacity="0.9" />
      <line x1="50" y1="4" x2="84" y2="44" stroke="#7B2FFF" strokeWidth="1.5" opacity="0.7" />
      <line x1="16" y1="44" x2="50" y2="126" stroke="#FF2FD4" strokeWidth="1.2" opacity="0.8" />
      <line x1="84" y1="44" x2="50" y2="126" stroke="#7B2FFF" strokeWidth="1.2" opacity="0.5" />
      {/* Apex glow dots */}
      <circle cx="50" cy="4" r="3" fill="#00F0FF" opacity="0.95" />
      <circle cx="50" cy="4" r="7" fill="#00F0FF" opacity="0.2" />
      <circle cx="50" cy="126" r="2.5" fill="#FF2FD4" opacity="0.8" />
      <circle cx="16" cy="44" r="2" fill="#00F0FF" opacity="0.7" />
      <circle cx="84" cy="44" r="2" fill="#7B2FFF" opacity="0.7" />
    </svg>
  );
}

const sizeMap = {
  sm: { icon: "w-[28px] h-[36px]", name: "text-[17px]", gap: "gap-2.5" },
  md: { icon: "w-[34px] h-[44px]", name: "text-[22px]", gap: "gap-3" },
  lg: { icon: "w-[48px] h-[62px]", name: "text-[32px]", gap: "gap-3.5" },
};

export default function MorphixLogo({
  size = "md",
  showTagline = false,
  className = "",
}: MorphixLogoProps) {
  const s = sizeMap[size];
  const uid = `mx-${size}`;

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span className={`${s.icon} flex-shrink-0`}>
        <MorphixIcon id={uid} />
      </span>
      <span className="flex flex-col">
        <span
          className={`${s.name} font-black tracking-[-0.5px] leading-none`}
          style={{
            fontFamily: "'Arial Black', Impact, sans-serif",
            background: "linear-gradient(90deg, #ffffff 0%, #ffffff 60%, #00F0FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          MORPHIX
        </span>
        {showTagline && (
          <span className="text-[9px] font-normal tracking-[4px] text-[#444] uppercase leading-tight mt-0.5">
            AI · 3D · Generation
          </span>
        )}
      </span>
    </span>
  );
}

export { MorphixIcon };
