import type { ReactNode } from "react";

/* Shared layout/typography primitives for the landing sections. */

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ roman, label }: { roman: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      <span className="font-display text-base italic normal-case tracking-normal text-foreground">{roman}</span>
      <span>{label}</span>
    </div>
  );
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-3.5 max-w-[880px] text-balance font-display text-[clamp(2.25rem,5vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] [&_em]:font-normal [&_em]:italic [&_em]:text-muted-foreground ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mt-5 max-w-[600px] text-lg leading-relaxed text-muted-foreground ${className}`}>{children}</p>
  );
}
