import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base URL for the app - used for OG images and canonical URLs
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hyde.ai';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Hyde - AI Music Generator",
    template: "%s | Hyde",
  },
  description: "Create unique AI-generated music in seconds. Generate custom tracks and playlists with Hyde, powered by ElevenLabs' advanced AI music technology.",
  keywords: [
    "AI music generator",
    "AI music",
    "music generation",
    "AI playlist",
    "AI tracks",
    "ElevenLabs",
    "generative music",
    "AI composer",
    "music AI",
    "create music online",
  ],
  authors: [{ name: "Hyde" }],
  creator: "Hyde",
  publisher: "Hyde",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Hyde",
    title: "Hyde - AI Music Generator",
    description: "Create unique AI-generated music in seconds. Generate custom tracks and playlists powered by advanced AI technology.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Hyde - AI Music Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyde - AI Music Generator",
    description: "Create unique AI-generated music in seconds. Generate custom tracks and playlists powered by advanced AI technology.",
    images: ["/opengraph-image"],
    creator: "@hyde_ai",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  category: "music",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#141414" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
