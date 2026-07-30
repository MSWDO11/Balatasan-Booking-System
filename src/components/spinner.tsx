"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizeClass = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-16 h-16" : "w-10 h-10";

  return (
    <div className={cn("relative inline-block", sizeClass, className)} role="status" aria-label="Loading">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            width: "18%",
            height: "8%",
            top: "46%",
            left: "41%",
            background: "#12AFAB",
            transformOrigin: "center 280%",
            transform: `rotate(${i * 30}deg)`,
            opacity: 1 - (i * 0.07),
            animation: `spinner-fade 1.2s linear infinite`,
            animationDelay: `${-((12 - i) / 12)}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes spinner-fade {
          0%   { opacity: 1; }
          100% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Spinner size="lg" />
      {label && <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}
