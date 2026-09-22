"use client";

import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "./components/Shell";
import { Hero } from "./components/Hero";
import { TrustedBy } from "./components/TrustedBy";
import { ManifestoSection } from "./components/Manifesto";
import { CapabilitiesSection } from "./components/Capabilities";
import { SystemAnatomy } from "./components/Anatomy";
import { SystemsSection } from "./components/Systems";
import { ROUTES } from "./components/routes";

export default function LandingPage() {
  const [active, setActive] = useState("studio");

  // Preserve referral capture that previously lived in app/page.tsx
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("anora_ref", ref);
    } catch {
      /* no-op */
    }
  }, []);

  const onNavigate = (key: string) => {
    setActive(key);
    const el = document.getElementById(key);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div data-screen-label="ANORA Labs Site">
      <SiteHeader active={active} onNavigate={onNavigate} routes={ROUTES} />
      <Hero headline="default" routes={ROUTES} />
      <TrustedBy />
      <ManifestoSection />
      <CapabilitiesSection />
      <SystemAnatomy />
      <SystemsSection />
      <SiteFooter />
    </div>
  );
}
