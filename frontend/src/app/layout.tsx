import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://3dmorphix.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#F4F1E6" },
    { media: "(prefers-color-scheme: light)", color: "#F4F1E6" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Morphix 3D — AI Mechanical CAD & Architecture BIM Platform",
    template: "%s | Morphix 3D",
  },
  description:
    "Generate CNC-ready Mechanical B-Rep CAD parts and 3D Architectural floor plans from text prompts using AI. Export STEP, STL, DXF, GLB & OBJ in one unified drafting studio.",
  keywords: [
    "AI mechanical CAD generator",
    "text to CAD",
    "AI floor plan to 3D",
    "architecture BIM AI",
    "STEP STL DXF GLB OBJ",
    "CNC ready 3D parts",
    "parametric gear generator",
    "3D printing CAD models",
  ],
  authors: [{ name: "Morphix 3D", url: SITE_URL }],
  creator: "Morphix 3D",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Morphix 3D",
    title: "Morphix 3D — AI Mechanical CAD & Architecture BIM Platform",
    description:
      "Generate CNC-ready Mechanical CAD parts and 3D Architectural floor plans with AI. Free 200 credits on signup.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Morphix 3D Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morphix 3D — AI Mechanical CAD & Architecture BIM Platform",
    description:
      "Generate CNC-ready Mechanical CAD parts and 3D Architectural floor plans with AI. Free 200 credits on signup.",
    images: ["/opengraph-image"],
    creator: "@morphix3d",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#F4F1E6] text-[#141413]`}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#FAF8F2",
                color: "#141413",
                border: "1.5px solid #141413",
                borderRadius: "12px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
