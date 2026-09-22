import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import localFont from "next/font/local";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const gentiumBasic = localFont({
  src: [
    { path: "../public/fonts/GenBasR.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/GenBasI.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/GenBasB.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/GenBasBI.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-gentium",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "ANORA Labs - The Open Source Flora.ai Alternative";
const SITE_DESCRIPTION =
  "ANORA Labs is the AI-powered canvas for designers, brand teams, and agencies. Generate, edit, and produce visuals across 300+ models in one workspace.";

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://anora.yaps.gg"),
  keywords: ["ai", "ai platform", "creative canvas", "open-source"],
  
  alternates: {
    canonical: "/",
  },

  authors: [
    {
      name: "Ibrohim Abdivokhidov",
      url: "https://github.com/yapsgg",
    },
  ],

  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "ANORA Labs",
    type: "website",
    url: "/",
  },

  icons: {
    icon: '/logos/anora-mark.svg',
  },

  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: '@yapsgg',
    creator: '@yapsgg',
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },

  appleWebApp: {
    title: SITE_TITLE,
    statusBarStyle: 'black-translucent',
  },
  
  appLinks: {
    web: {
      url: "https://anora.yaps.gg",
      should_fallback: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overscroll-none" suppressHydrationWarning>
      {UMAMI_WEBSITE_ID && (
        <Script async src={UMAMI_SRC} data-website-id={UMAMI_WEBSITE_ID} />
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
