import type { ReactNode } from "react";
import { CornerDownRight } from "lucide-react";
import { Container, Eyebrow, SectionTitle } from "./_ui";

/* ----------------------------------------------------------------------
   System Anatomy — what a codified system holds: Anchor / Light / Prompt /
   Edit grade. Each is a small specimen card.
   ---------------------------------------------------------------------- */
export function SystemAnatomy() {
  return (
    <section id="anatomy" className="scroll-mt-20">
      <Container className="py-20 md:py-28">
        <Eyebrow roman="v · a" label="Anatomy of a system" />
        <SectionTitle>
          Four parts. <em>Encoded once.</em>
          <br />
          Re-applied <em>forever.</em>
        </SectionTitle>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <AnatomyCard no="01" tag="Anchor" title="One reference" spec="3 : 4 · 1 536 × 2 048">
            <div
              className="aspect-[3/4] w-full rounded-sm border border-border bg-cover bg-top"
              style={{ backgroundImage: "url(/images/reference-model.png)" }}
            />
          </AnatomyCard>

          <AnatomyCard no="02" tag="Light" title="Lighting recipe" spec="3 800 K · soft · 0.62">
            <div className="grid gap-1.5 pt-1">
              <LightRow k="Key" v="north window · late afternoon" />
              <LightRow k="Fill" v="parchment bounce" />
              <LightRow k="Temp" v="3 800 K" />
              <LightRow k="Contrast" v="0.62" />
              <LightRow k="Grain" v="35mm · 200 ISO" />
            </div>
          </AnatomyCard>

          <AnatomyCard no="03" tag="Prompt pattern" title="Reusable script" spec="6 slots · 2 negatives">
            <div className="rounded-sm border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <Slot>{"{subject}"}</Slot>, late-afternoon north light, 3/4 turn, <Slot>{"{prop}"}</Slot> held low, linen
              drape, 35mm grain, sienna lift +0.45.
              <br />
              <span className="mt-1.5 inline-block text-foreground/70">— no plastic, no neon, no glossy skin</span>
            </div>
          </AnatomyCard>

          <AnatomyCard no="04" tag="Edit grade" title="Final master" spec="2.4s avg cut · single cello">
            <div className="grid gap-2 pt-1">
              <EditRow meta="cut" pct={24} val="2.4s" />
              <EditRow meta="warm shadows" pct={62} val="+0.45" />
              <EditRow meta="audio" pct={18} val="cello, sparse" />
              <EditRow meta="caption" pct={40} val="cormorant italic" />
            </div>
          </AnatomyCard>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-md border border-border bg-card p-6 sm:flex-row sm:items-baseline sm:gap-5">
          <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <CornerDownRight className="size-3.5" /> Output
          </span>
          <span className="font-display text-[22px] leading-snug [&_em]:font-normal [&_em]:italic [&_em]:text-foreground">
            <em>Hundreds</em> of faithful renders — each indistinguishable from the creative director&apos;s hand, each
            for <em>$10–30</em> in compute, not a production day.
          </span>
        </div>
      </Container>
    </section>
  );
}

type AnatomyCardProps = { no: string; tag: string; title: string; spec: string; children: ReactNode };

function AnatomyCard({ no, tag, title, spec, children }: AnatomyCardProps) {
  return (
    <div className="flex min-h-[340px] flex-col gap-2 bg-card p-6">
      <div className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">{no}</div>
      <div className="font-display text-sm font-medium italic tracking-wide text-foreground/80">{tag}</div>
      <div className="font-display text-[22px] font-medium leading-tight text-foreground">{title}</div>
      <div className="mt-1.5 flex-1">{children}</div>
      <div className="mt-2 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {spec}
      </div>
    </div>
  );
}

function LightRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="text-right text-xs font-medium text-foreground">{v}</span>
    </div>
  );
}

function Slot({ children }: { children: ReactNode }) {
  return <span className="rounded-sm bg-white/10 px-1.5 py-px text-foreground/90">{children}</span>;
}

function EditRow({ meta, pct, val }: { meta: string; pct: number; val: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr_72px] items-center gap-2 sm:grid-cols-[90px_1fr_80px]">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{meta}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full bg-foreground/70" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-right font-mono text-[10px] text-foreground/80">{val}</span>
    </div>
  );
}
