import { Cormorant_Garamond } from "next/font/google";

/* Editorial display serif for headlines — exposed as the `font-display`
   Tailwind utility via the --font-cormorant variable (see app/globals.css). */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${cormorant.variable} bg-background text-foreground antialiased`}>{children}</div>
  );
}
