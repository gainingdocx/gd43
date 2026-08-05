import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ProductAnalytics } from "@/components/analytics/product-analytics";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
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
    default: "GainingDocx — Freight Document Manager",
    template: "%s | GainingDocx",
  },
  // Leads with the phrase people actually search. "Document QA" is internal
  // vocabulary — nobody types it — and this string is the site-wide fallback
  // description, so it was spending the most valuable snippet we own on a term
  // with no search demand.
  description:
    "Shipping document automation for freight forwarders and exporters. Extract data from bills of lading, air waybills, commercial invoices and packing lists, then catch discrepancies before they delay cargo.",
  applicationName: "GainingDocx",
  category: "Shipping document software",
  keywords: ["air freight document automation", "air waybill parser", "MAWB HAWB reconciliation", "shipping document parser", "Bill of Lading parser", "commercial invoice parser", "packing list parser", "shipping document templates", "shipping calculators"],
  authors: [{ name: "GainingDocx", url: "https://gainingdocx.com" }],
  creator: "GainingDocx",
  publisher: "GainingDocx",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    siteName: "GainingDocx",
    type: "website",
    images: [{ url: "/og.png", width: 1774, height: 887, alt: "GainingDocx air and ocean freight paperwork workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
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
        <FeedbackWidget />
        <ProductAnalytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
