import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASCON Encryption Visualizer",
  description: "Interactive visualization tool for ASCON lightweight encryption algorithm. Explore the encryption process step by step.",
  keywords: ["ASCON", "encryption", "cryptography", "visualization", "lightweight", "security"],
  openGraph: {
    title: "ASCON Encryption Visualizer",
    description: "Interactive visualization tool for ASCON lightweight encryption algorithm",
    images: [
      {
        url: "/ascon-visualizer-preview.png",
        width: 1200,
        height: 630,
        alt: "ASCON Encryption Visualizer Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCON Encryption Visualizer",
    description: "Interactive visualization tool for ASCON lightweight encryption algorithm",
    images: ["/ascon-visualizer-preview.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
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
        {children}
      </body>
    </html>
  );
}
