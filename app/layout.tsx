import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gainingdocx.com"),
  title: {
    default: "GainingDocx — AI Shipping Document Parser & Tools",
    template: "%s | GainingDocx",
  },
  description:
    "Parse, validate, compare and create shipping paperwork with AI document extraction, free calculators, guides and editable logistics templates.",
  applicationName: "GainingDocx",
  category: "Shipping document software",
  keywords: ["shipping document parser", "Bill of Lading parser", "commercial invoice parser", "packing list parser", "shipping document templates", "shipping calculators"],
  authors: [{ name: "GainingDocx", url: "https://gainingdocx.com" }],
  creator: "GainingDocx",
  publisher: "GainingDocx",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    siteName: "GainingDocx",
    type: "website",
    images: [{ url: "/og-v2.png", width: 2048, height: 1024, alt: "GainingDocx Easy PaperWork shipping document workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-v2.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#013BB3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
