import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Morphix — AI-Powered 3D Model Generation Platform",
  description:
    "Generate stunning 3D models from text or images using AI. Text-to-3D, Image-to-3D, AI Texturing, Smart Remesh, Auto-Rigging and more.",
  keywords: [
    "3D model generation",
    "AI 3D",
    "text to 3D",
    "image to 3D",
    "AI texturing",
    "open source",
    "3D printing",
    "GLB",
    "FBX",
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
      </body>
    </html>
  );
}
