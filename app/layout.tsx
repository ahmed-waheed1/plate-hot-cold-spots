import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://plate-hot-cold-spots.vercel.app"),
  title: {
    default: "Hot and Cold Spots on a Heated Plate · Math 3",
    template: "%s · Hot and Cold Spots",
  },
  description:
    "Finding the hot spot, cold spot and saddle points of a heated metal plate with partial derivatives and the second derivative test, with a Python solution and an interactive 3D surface. Math 3 (BAS 113), Badr University in Cairo.",
  openGraph: {
    type: "website",
    siteName: "Hot and Cold Spots",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#D7263D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
