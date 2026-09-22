import Image from "next/image";
import { Container } from "./_ui";

type Logo = { name: string; src?: string; href: string };

const LOGOS: Logo[] = [
  { name: "Podium", src: "/logos/podium.svg", href: "https://www.instagram.com/podium.tashkent/" },
  { name: "Glamour Avenue", src: "/logos/glamour.jpeg", href: "https://www.instagram.com/glamour.av/" },
  { name: "LALI Fashion House", src: "/logos/lali-fashion-house.jpeg", href: "https://www.instagram.com/lalifashion/" },
  { name: "SAAZ Studio", href: "https://www.instagram.com/saazgram/" },
];

const FADE =
  "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)";

function LogoTile({ name, src, href }: Logo) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mr-5 flex h-20 shrink-0 items-center rounded-md bg-white px-5 transition-opacity hover:opacity-80"
    >
      {src ? (
        <div className="relative h-16 w-36">
          <Image src={src} alt={name} fill sizes="210px" className="object-contain" />
        </div>
      ) : (
        <span className="font-display text-3xl font-medium tracking-tight text-neutral-900">
          SAAZ{" "}
          <span className="font-sans text-[13px] uppercase tracking-[0.2em] text-neutral-500">
            Studio
          </span>
        </span>
      )}
    </a>
  );
}

/* ----------------------------------------------------------------------
   Trusted by — seamless, pause-on-hover logo marquee. The track holds two
   copies of the row; the keyframe translates it by exactly one copy.
   ---------------------------------------------------------------------- */
export function TrustedBy() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section aria-label="Trusted by the world's top creative agencies" className="bg-black/20 py-14">
      <Container>
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by the Central Asia&apos;s &amp; Europe&apos;s top creative agencies
        </p>
      </Container>
      <div
        className="group relative mt-8 overflow-hidden"
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      >
        <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
          {row.map((l, i) => (
            <LogoTile key={`${l.name}-${i}`} {...l} />
          ))}
        </div>
      </div>
    </section>
  );
}
