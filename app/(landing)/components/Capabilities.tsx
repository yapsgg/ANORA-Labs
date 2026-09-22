import type { ReactNode } from "react";
import { Container, Eyebrow, Lede, SectionTitle } from "./_ui";

type Capability = {
  no: string;
  title: ReactNode;
  body: string;
  meta: string;
  tag: string;
};

const CAPS: Capability[] = [
  {
    no: "I.",
    title: (
      <>
        Cast <em>from a single profile shot.</em>
      </>
    ),
    body: "Hand the canvas one casting headshot. Get back twelve faithful variations — angles, expressions, wardrobe shifts — that hold to the same face.",
    meta: "01 reference · 12 looks · no casting call",
    tag: "Casting",
  },
  {
    no: "II.",
    title: (
      <>
        Relight, relocate, <em>recast.</em>
      </>
    ),
    body: "Move the same scene to a new location, change the lighting, shift the mood, swap the character — all from one reference. Keep the talent, keep the system.",
    meta: "Location · lighting · mood · character swap",
    tag: "Transform",
  },
  {
    no: "III.",
    title: (
      <>
        Bring a still <em>into motion.</em>
      </>
    ),
    body: "Drag any image straight into a video block. The canvas brings it to life at 24fps, with the same grain and grade as the parent frame — no separate tool, no re-prompting.",
    meta: "04s · 24fps · text → image → video",
    tag: "Motion",
  },
  {
    no: "IV.",
    title: (
      <>
        Edit <em>without leaving the room.</em>
      </>
    ),
    body: "Cut, grade, score, caption. The final film is mastered on the same canvas, so colour and tempo never drift from what you encoded.",
    meta: "Master cut · graded in-canvas",
    tag: "Edit",
  },
];

/* ----------------------------------------------------------------------
   Capabilities — the four core moves, all on one generative canvas.
   ---------------------------------------------------------------------- */
export function CapabilitiesSection() {
  return (
    <section id="studio" className="scroll-mt-20">
      <Container className="py-20 md:py-28">
        <Eyebrow roman="i — iv" label="The four moves" />
        <SectionTitle>
          One canvas. <em>Four moves.</em>
          <br />
          Concept to finished campaign.
        </SectionTitle>
        <Lede>
          Think of it as an assembly line for your imagination — connect AI tools like Lego bricks on one generative
          canvas. No five disconnected tools, no $1,500-a-month in subscriptions, no copy-paste between tabs. Change a
          detail at the start of the line and watch it ripple through the whole piece.
        </Lede>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
          {CAPS.map((c) => (
            <div key={c.no} className="flex min-h-[260px] flex-col gap-3.5 bg-card p-8 sm:p-9">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {c.no} · {c.tag}
              </div>
              <div className="flex-1">
                <div className="font-display text-[28px] font-medium leading-tight [&_em]:font-normal [&_em]:italic [&_em]:text-muted-foreground">
                  {c.title}
                </div>
                <p className="mt-3.5 max-w-[480px] text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">{c.meta}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
