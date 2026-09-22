"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./_ui";
import type { Routes } from "./routes";
import { ROUTES } from "./routes";

const DEMO_REEL = "https://www.instagram.com/reel/DVq-uBrDNhH/";

/* The hero demo — the real LALI Fashion workflow.
   We show the actual workflow canvas (a screenshot) rather than a live iframe:
   the editor requires auth and its IDs are Convex-deployment-specific, so it
   can't be framed reliably. The whole shot links out to the live workflow. */
const WORKFLOW_ID = "k177na48h605teh51jjptfq9gx82h6fk";
const WORKFLOW_URL = `https://www.anora.yaps.gg/workflow/${WORKFLOW_ID}`;
const WORKFLOW_COVER = "/images/systems/lali-fashion.png";

type HeroProps = {
  headline?: keyof typeof HEADLINES;
  routes?: Routes;
};

const HEADLINES = {
  default: (
    <>
      The Open Source <em>Flora.ai</em> Alternative
    </>
  ),
  atelier: (
    <>
      One canvas for every
      <br />
      creative <em>AI model.</em>
    </>
  ),
  execute: (
    <>
      Encode the vision once.
      <br />
      <em>Execute it faithfully.</em>
    </>
  ),
} satisfies Record<string, ReactNode>;

export function Hero({ headline = "default", routes = ROUTES }: HeroProps) {
  return (
    <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32">
      <Container>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px w-7 bg-muted-foreground/60" />
          For creative agencies
        </div>

        <h1 className="mt-4 max-w-[1100px] text-balance font-display text-[clamp(2.5rem,7vw,6.5rem)] font-normal leading-[0.96] tracking-[-0.025em] [&_em]:font-normal [&_em]:italic [&_em]:text-muted-foreground">
          {HEADLINES[headline] || HEADLINES["default"]}
        </h1>

        <p className="mt-7 max-w-[540px] text-lg leading-relaxed text-muted-foreground">
          Every creative AI model for text, image, and video on one canvas. Wire a concept into an image, drag it
          into a video, and codify the whole process into repeatable systems — your creative environment for
          generative workflows.
        </p>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={routes.studio}>
              Open the studio <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <a
          href={DEMO_REEL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-background py-2 pl-2.5 pr-4 transition-colors hover:border-foreground/30"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <Play className="size-3 fill-current" />
          </span>
          <span className="text-sm text-muted-foreground ">
            <em className="font-display text-base italic text-foreground">World&apos;s #1 AI Model Casting</em>
          </span>
          <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </a>

        {/* Live workflow — real canvas screenshot, links out to the workflow. */}
        <div className="mt-7 overflow-hidden rounded-lg border border-border bg-black shadow-2xl">
          <div className="flex h-9 items-center gap-2.5 border-b border-white/10 px-3.5">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="ml-3.5 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-white/70" />
              Live workflow · <em className="font-display text-[13px] italic text-foreground">LALI Fashion</em>
            </span>
            <a
              href={WORKFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Open <ArrowUpRight className="size-3" />
            </a>
          </div>
          <a
            href={WORKFLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the LALI Fashion workflow on ANORA Labs"
            className="group relative block aspect-video bg-black bg-cover bg-top"
            style={{ backgroundImage: `url(${WORKFLOW_COVER})` }}
          >
            <span className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              Open workflow <ArrowUpRight className="size-3.5" />
            </span>
          </a>
        </div>
      </Container>
    </section>
  );
}
