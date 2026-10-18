import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://morphix3d.vercel.app";

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
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e1e38",
                color: "#f1f5f9",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: "12px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
