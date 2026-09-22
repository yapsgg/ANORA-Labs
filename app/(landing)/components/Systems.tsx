import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Lede } from "./_ui";

type SystemSpec = {
  name: string;
  author: string;
  tag: string;
  cover: string;
  workflow?: string;
};

const SYSTEMS: SystemSpec[] = [
  {
    name: "Model Casting",
    author: "Creative Studio of Saidazim Fazilov",
    tag: "World's #1 AI casting",
    cover: "/images/systems/fashion.png",
    workflow: "https://www.anora.yaps.gg/workflow/k179a1rnc6absyt9r14xvq4fcs82kf5x",
  },
  {
    name: "LALI Fashion",
    author: "Saidazim Fazilov · Creative Director, LALI Fashion",
    tag: "Luxury fashion",
    cover: "/images/systems/lali-fashion.png",
    workflow: "https://www.anora.yaps.gg/workflow/k177na48h605teh51jjptfq9gx82h6fk",
  },
  {
    name: "Instagram carousel",
    author: "Murodillo · Co-founder, Design Club",
    tag: "Social",
    cover: "/images/systems/carousel.png",
  },
  {
    name: "Founder invitations",
    author: "UZCombinator Accelerator",
    tag: "Invitation",
    cover: "/images/systems/uzcombinator.png",
    workflow: "https://www.anora.yaps.gg/workflow/k17273jaqyadgrqbyzfnd0d3q582vqtc",
  },
  {
    name: "Lavanda Bo'ylab",
    author: "UZreport · supervised by Abdul, Sarmo Labs",
    tag: "Campaign",
    cover: "/images/systems/lavanda-buylab.png",
    workflow: "https://www.anora.yaps.gg/workflow/k171sk1w6qkf879e94gbgz2t9d8121vd",
  },
  {
    name: "TerraPro",
    author: "TerraPro · clothing brand",
    tag: "Fashion",
    cover: "/images/systems/terrapro.png",
    workflow: "https://www.anora.yaps.gg/workflow/k178mbjejwg7ppmq59kef3zafn81st75",
  },
];

/* ----------------------------------------------------------------------
   Systems showcase — real codified systems built on ANORA Labs by working
   studios. Each card opens the actual workflow behind a finished campaign.
   ---------------------------------------------------------------------- */
export function SystemsSection() {
  return (
    <section id="systems" className="scroll-mt-20 border-t border-border bg-black/20">
      <Container className="py-20 md:py-28">
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="font-display text-base italic normal-case tracking-normal text-foreground">v</span>
          <span>Codified creative systems</span>
        </div>
        <h2 className="mt-3.5 max-w-[880px] text-balance font-display text-[clamp(2.25rem,5vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] [&_em]:font-normal [&_em]:italic [&_em]:text-foreground/80">
          Senior creative directors <em>encode the vision.</em>
          <br />
          The team executes it — faithfully — at scale.
        </h2>
        <Lede>
          Real systems, built on ANORA Labs by working studios. Open any one to see the exact workflow — references, prompt
          patterns, edits — behind the finished campaign.
        </Lede>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((s) => (
            <SystemCard key={s.name} {...s} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/marketplace">
              Browse more templates on the marketplace <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function SystemCard({ name, author, tag, cover, workflow }: SystemSpec) {
  const inner = (
    <>
      <div className="aspect-video w-full border-b border-border bg-black bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
      <div className="grid gap-2 p-[18px]">
        <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>{tag}</span>
          {workflow && (
            <span className="inline-flex shrink-0 items-center gap-1 text-foreground/70">
              Open workflow <ArrowUpRight className="size-3" />
            </span>
          )}
        </div>
        <div className="font-display text-2xl font-medium italic leading-tight text-foreground">{name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{author}</div>
      </div>
    </>
  );

  const cls = "block overflow-hidden rounded-md border border-border bg-card transition-colors";

  if (workflow) {
    return (
      <a href={workflow} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}
