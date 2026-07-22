import type { Metadata, Viewport } from "next";
import { Archivo, Jost, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-archivo",
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
  "A concept piece: freight software that treats cargo as an object rather than a row. One coil, resolved to a million points, indexed across a 412-node network.";

export const metadata: Metadata = {
  // relative OG/icon URLs need a base to resolve against when shared
  metadataBase: new URL("https://lode.example"),
  title: "LODE — the freight operating system",
  description: DESCRIPTION,
  applicationName: "LODE",
  openGraph: {
    title: "LODE — the freight operating system",
    description: DESCRIPTION,
    siteName: "LODE",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "LODE — the freight operating system",
    description: DESCRIPTION,
  },
  robots: {
    // a concept piece, not a service — keep it out of the index
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
      className={`${archivo.variable} ${jost.variable} ${inter.variable} ${mono.variable}`}
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
