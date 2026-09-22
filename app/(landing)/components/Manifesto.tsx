import type { ReactNode } from "react";
import { Container } from "./_ui";

type Principle = { no: string; body: ReactNode };

const PRINCIPLES: Principle[] = [
  {
    no: "i.",
    body: (
      <>
        A campaign used to mean five or more disconnected tools — ChatGPT, Nano Banana 2, KlingAI, CapCut — at{" "}
        <em>$1,500+ a month</em>, and endless copy-paste between tabs.
      </>
    ),
  },
  {
    no: "ii.",
    body: (
      <>
        And every project restarted from zero. The creative director&apos;s taste — their aesthetic, their prompt
        logic — lived <em>in their head</em>, never in the team&apos;s workflow.
      </>
    ),
  },
  {
    no: "iii.",
    body: (
      <>
        ANORA Labs codifies that taste into a repeatable <em>system</em>, and replaces the crew-and-location shoot it once
        took. Last week a full agency shoot cost less than breakfast — about <em>$10</em>.
      </>
    ),
  },
];

/* ----------------------------------------------------------------------
   Manifesto — pure typography. The brand's "credo."
   ---------------------------------------------------------------------- */
export function ManifestoSection() {
  return (
    <section id="credo" className="scroll-mt-20">
      <Container className="py-20 md:py-24">
        <div className="h-px w-full bg-border" />
        <div className="mt-9 flex flex-wrap items-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="font-display text-base italic normal-case tracking-normal text-foreground">— Credo —</span>
          <span>For the working creative</span>
        </div>

        <p className="my-8 max-w-[1080px] text-balance font-display text-[clamp(2rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] [&_em]:font-normal [&_em]:italic [&_em]:text-foreground">
          The first generation of AI tools spoke to <em>everyone</em>.
          <br className="hidden sm:inline" /> The next belongs to <em>the studio</em>.
        </p>

        <div className="grid border-t border-border sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.no}
              className="border-b border-border p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <div className="mb-3.5 font-display text-2xl font-medium italic text-muted-foreground">{p.no}</div>
              <p className="font-display text-xl leading-snug text-foreground [&_em]:font-normal [&_em]:italic [&_em]:text-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">ANORA Labs</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      </Container>
    </section>
  );
}
