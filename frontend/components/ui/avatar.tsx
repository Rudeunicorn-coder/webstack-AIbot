import * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({
  name,
  className,
  color = "#0A1F44",
}: {
  name: string;
  className?: string;
  color?: string;
}) {
  const initials = (name || "W")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials || "W"}
    </div>
  );
}

function AvatarFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground",
        className
      )}
    />
  );
}

export { Avatar, AvatarFallback };