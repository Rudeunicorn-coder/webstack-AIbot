import { cn } from "@/lib/utils";

/**
 * WebStackPro Logo
 * A stack of 3 layers that form a "W" with a chat bubble + AI circuit node.
 * Colors: Navy #0A1F44, Cyan #00D4FF, White.
 */

export function WebStackProLogo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-label="WebStackPro logo"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wsp-cyan" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Chat bubble (back layer) */}
        <path
          d="M32 6c-15 0-26 9.5-26 21 0 6.6 3.7 12.4 9.5 16.2L12 58l13.4-6.7c2 0.5 4.3 0.7 6.6 0.7 15 0 26-9.5 26-21S47 6 32 6Z"
          fill="#0A1F44"
        />
        <path
          d="M32 10c-13.6 0-22 8.2-22 17.8 0 5.7 3.2 10.6 8.2 13.7L16 51.5l10.6-5.3c1.8 0.4 3.6 0.6 5.4 0.6 13.6 0 22-8.2 22-17.8S45.6 10 32 10Z"
          fill="url(#wsp-cyan)"
          opacity="0.18"
        />

        {/* Stacked W layers */}
        <g fill="#FFFFFF">
          {/* bottom layer */}
          <rect x="14" y="38" width="36" height="5" rx="2.5" />
          {/* left + right W stems */}
          <rect x="14" y="21" width="5" height="14" rx="2.5" />
          <rect x="45" y="21" width="5" height="14" rx="2.5" />
          {/* W middle peaks */}
          <path
            d="M21 21 32 34l6-6 5 5v6l-6-6-6 6-6-6-4 4-5-5Z"
            fill="#FFFFFF"
          />
        </g>

        {/* AI circuit on the right peak */}
        <g stroke="#00D4FF" strokeWidth="3" strokeLinecap="round">
          <path d="M45 26v8" />
          <path d="M49 30h-8" />
          <line x1="49" y1="30" x2="52" y2="27" />
          <line x1="52" y1="33" x2="49" y2="30" />
        </g>
        <circle cx="49" cy="24" r="2" fill="#00D4FF" />
        <circle cx="37" cy="21" r="2" fill="#00D4FF" />
      </svg>
    </div>
  );
}

export function WebStackProWordmark({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <WebStackProLogo size={34} />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-extrabold tracking-tight",
            dark ? "text-white" : "text-navy"
          )}
        >
          WebStack<span className="text-cyan-dark">Pro</span>
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.2em]",
            dark ? "text-cyan" : "text-navy/60"
          )}
        >
          Automate. Convert. Grow.
        </span>
      </div>
    </div>
  );
}