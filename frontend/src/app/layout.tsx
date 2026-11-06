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
    default: "Morphix 3D — AI-Powered 3D Model Generation",
    template: "%s | Morphix 3D",
  },
  description:
    "Generate stunning 3D models from text or images using AI. Text-to-3D, Image-to-3D, AI Texturing, Smart Remesh, Auto-Rigging, Architecture & Mechanical CAD — all in one platform.",
  keywords: [
    "AI 3D model generator",
    "text to 3D",
    "image to 3D",
    "AI texturing",
    "3D model generation",
    "meshy alternative",
    "free 3D AI",
    "GLB FBX OBJ STL",
    "auto rigging",
    "architecture AI",
    "mechanical CAD AI",
    "3D printing models",
  ],
  authors: [{ name: "Morphix 3D", url: SITE_URL }],
  creator: "Morphix 3D",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Morphix 3D",
    title: "Morphix 3D — AI-Powered 3D Model Generation",
    description:
      "Generate stunning 3D models from text or images. Free 200 credits on signup. No credit card required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Morphix 3D Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morphix 3D — AI-Powered 3D Model Generation",
    description:
      "Generate stunning 3D models from text or images. Free 200 credits on signup.",
    images: ["/og-image.png"],
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
