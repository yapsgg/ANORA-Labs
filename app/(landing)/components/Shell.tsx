import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./_ui";
import type { Routes } from "./routes";
import { ROUTES } from "./routes";
import Image from "next/image";

/* Wordmark — logo mark followed by the editorial serif name, tracked open. */
export function SiteWordmark({
  className = "",
  markClassName = "",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logos/anora-mark.svg"
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className={`h-[1.7em] w-[1.7em] shrink-0 ${markClassName}`}
      />
      <span className={`font-display font-medium uppercase leading-none tracking-[0.2em] ${className}`}>ANORA Labs</span>
    </span>
  );
}

type SiteHeaderProps = {
  active?: string;
  onNavigate?: (key: string) => void;
  routes?: Routes;
};

/* Header — fixed top bar. Nav collapses on mobile; CTAs stay. */
export function SiteHeader({ active = "studio", onNavigate, routes = ROUTES }: SiteHeaderProps) {
  const links = [
    { key: "credo", label: "Credo" },
    { key: "studio", label: "The Studio" },
    { key: "anatomy", label: "Anatomy" },
    { key: "systems", label: "Systems" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center">
        <SiteWordmark className="text-lg" />
        <nav className="ml-12 hidden gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.key}
              href={"#" + l.key}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.(l.key);
              }}
              className={`text-sm transition-colors hover:text-foreground ${active === l.key ? "text-foreground" : "text-muted-foreground"}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={routes.signin}>Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={routes.studio}>
              Open studio <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

type FooterColProps = { title: string; links: [string, string][]; external?: boolean };

function FooterCol({ title, links, external = false }: FooterColProps) {
  return (
    <div>
      <h6 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</h6>
      <div className="flex flex-col gap-2">
        {links.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* Footer */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-8 border-b border-border pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <SiteWordmark className="text-xl" />
            <p className="mt-3.5 max-w-[360px] font-display text-[17px] italic leading-snug text-muted-foreground">
              The Open Source Flora.ai Alternative
            </p>
            <p className="mt-3.5 max-w-[360px] text-[11px] uppercase leading-snug text-muted-foreground">
              Backed by
            </p>
            <a
              href="https://yaps.gg?utm_source=anora-labs&utm_medium=landing&utm_campaign=backed-by"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block font-display text-xl font-medium uppercase leading-none tracking-[0.2em] text-foreground transition-colors hover:text-muted-foreground"
            >
              YAPSGG
            </a>
          </div>
          <FooterCol
            title="Studio"
            links={[
              ["Canvas", "#studio"],
              ["Systems", "#systems"],
              ["Anatomy", "#anatomy"],
              ["Credo", "#credo"],
            ]}
          />
          <FooterCol
            title="Company"
            external
            links={[
              ["About", "https://github.com/yapsgg"],
              ["Careers", "https://github.com/yapsgg"],
              ["Contact", "https://github.com/yapsgg/ANORA-Labs/issues"],
            ]}
          />
          <FooterCol
            title="Resources"
            external
            links={[
              ["Documentation", "https://github.com/yapsgg/ANORA-Labs#readme"],
              ["Changelog", "https://github.com/yapsgg/ANORA-Labs/releases"],
              ["Status", "https://github.com/yapsgg/ANORA-Labs/issues"],
            ]}
          />
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          <span>© 2026 ANORA Labs · MIT licensed</span>
          <div className="ml-auto flex gap-4">
            <span>Tashkent, Uzbekistan</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
