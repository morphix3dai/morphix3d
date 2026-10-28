"use client";

interface MorphixLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  theme?: "light" | "dark";
}

function MorphixIcon({ id = "mx", theme = "light" }: { id?: string; theme?: "light" | "dark" }) {
  const inkColor = theme === "dark" ? "#F4F1E6" : "#141413";
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Left 3D Pillar */}
      <polygon id={`${id}-left`} points="16,28 34,18 34,74 16,84" fill={inkColor} />
      {/* Right 3D Pillar */}
      <polygon id={`${id}-right`} points="66,28 84,18 84,74 66,84" fill={inkColor} />
      {/* Diagonal Fold Wings meeting at center */}
      <polygon points="34,18 50,36 50,56 34,38" fill={inkColor} opacity="0.78" />
      <polygon points="66,28 50,36 50,56 66,48" fill={inkColor} />
      {/* Option A: Orange Sphere Resting on Top V-Surface (cx=50, cy=29) */}
      <circle cx="50" cy="29" r="7.5" fill="#FF6A1A" />
    </svg>
  );
}

const sizeMap = {
  sm: { icon: "w-[32px] h-[32px]", name: "text-[26px]", gap: "gap-2.5", tag: "text-[9.5px] px-1.5 py-0.5" },
  md: { icon: "w-[38px] h-[38px]", name: "text-[32px]", gap: "gap-3", tag: "text-[10px] px-2 py-0.5" },
  lg: { icon: "w-[48px] h-[48px]", name: "text-[40px]", gap: "gap-3.5", tag: "text-[11px] px-2.5 py-0.5" },
};

export default function MorphixLogo({
  size = "md",
  showTagline = false,
  className = "",
  theme = "light",
}: MorphixLogoProps) {
  const s = sizeMap[size];
  const uid = `mx-${size}`;
  const textColor = theme === "dark" ? "text-[#F4F1E6]" : "text-[#141413]";

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span className={`${s.icon} flex-shrink-0`}>
        <MorphixIcon id={uid} theme={theme} />
      </span>
      <span className="flex items-center gap-2.5">
        <span
          className={`${s.name} font-normal tracking-[-0.02em] leading-none ${textColor}`}
          style={{
            fontFamily: "'Instrument Serif', 'Newsreader', Georgia, serif",
          }}
        >
          Morphix
        </span>
        {showTagline && (
          <span
            className={`${s.tag} font-mono font-bold uppercase tracking-[0.08em] border ${
              theme === "dark"
                ? "border-[#F4F1E6]/40 bg-[#1E2126] text-[#F4F1E6]"
                : "border-[#141413] bg-[#EFECE0] text-[#141413]"
            }`}
          >
            3D Studio
          </span>
        )}
      </span>
    </span>
  );
}

export { MorphixIcon };
