import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

// const inter = Inter({
//   variable: "--font-sans",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "SeaSafe · Bridge Console",
  description: "Decision support at the helm.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="dark bg-slate-950 text-slate-100 antialiased min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
