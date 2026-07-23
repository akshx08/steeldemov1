import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Jost, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Type system:
   Space Grotesk — display. Engineered geometric grotesque; reads like precision
     instrumentation, which is the right register for gauges and standards.
   JetBrains Mono — specs and figures (tabular numerals).
   Jost — labels / eyebrows (small caps).
   Inter — body, always. */
const grotesk = Space_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-grotesk",
});
const jost = Jost({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jost",
});
const inter = Inter({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const DESCRIPTION =
  "N.R. Trading Co. — flat steel bought off India's largest mills since 2005. HR, CR, GP, GL, PPGI, PPGL and colour coated, slit and cut to your drawing, with the mill's own certificate and a firm price inside one working day.";

export const metadata: Metadata = {
  // relative OG/icon URLs need a base to resolve against when shared
  metadataBase: new URL("https://nrtrading.example"),
  title: "N.R. Trading Co. — flat steel, cut to your drawing",
  description: DESCRIPTION,
  applicationName: "N.R. Trading Co.",
  openGraph: {
    title: "N.R. Trading Co. — flat steel, cut to your drawing",
    description: DESCRIPTION,
    siteName: "N.R. Trading Co.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "N.R. Trading Co. — flat steel, cut to your drawing",
    description: DESCRIPTION,
  },
  robots: {
    // a demo build, not the company's live domain — keep it out of the index
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      /* the inline script below stamps `data-reduced` on <html> before React
         hydrates, which React would otherwise report as a server/client
         mismatch on every `?reduced=1` load */
      suppressHydrationWarning
      className={`${grotesk.variable} ${jost.variable} ${inter.variable} ${mono.variable}`}
    >
      <head>
        {/* `?reduced=1` forces the reduced-motion path. Set before first paint
            so the CSS half applies without a flash — see globals.css. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(new URLSearchParams(location.search).get('reduced')==='1')document.documentElement.dataset.reduced='1'}catch(e){}",
          }}
        />
        {/* Act stages ship at opacity 0 and are revealed by their scroll loop.
            Without JS that loop never runs and the page renders blank, so hand
            the no-JS reader a plain, fully visible document. */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "[data-stage]{opacity:1!important;visibility:visible!important;transform:none!important}" +
                "[data-stage] .rise,[data-stage] .fadeup{opacity:1!important;transform:none!important;animation:none!important}" +
                "main>section{height:auto!important}main>section>div{position:static!important;height:auto!important;padding:88px 0}",
            }}
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
