import { cn } from "@/lib/utils";

/**
 * WebStackPro Logo
 * Blue gradient rounded square with a "</>" code mark.
 * Colors: Gradient #1e40af → #3b82f6, White text.
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
          <linearGradient id="wsp-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="13" fill="url(#wsp-blue)" />
        <text
          x="32"
          y="43"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="bold"
          fontSize="19"
        >
          &lt;/&gt;
        </text>
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
            dark ? "text-white" : "text-[#1e3a5f]"
          )}
        >
          WebStack<span className={dark ? "text-blue-400" : "text-[#3b82f6]"}>Pro</span>
        </span>
        <span
          className={cn(
            "hidden text-[10px] font-medium uppercase tracking-[0.2em] min-[420px]:block",
            dark ? "text-cyan" : "text-navy/60"
          )}
        >
          Automate. Convert. Grow.
        </span>
      </div>
    </div>
  );
}