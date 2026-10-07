import type { Metadata } from "next";
import { Suspense } from "react";
import BackendBar from "@/components/BackendBar";
import { RefreshProvider } from "@/lib/refresh";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sofa Event Viewer",
  description: "Render a SofaScore event from any backend",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <RefreshProvider>
          <Suspense fallback={<div className="h-12 border-b border-zinc-200 bg-white" />}>
            <BackendBar />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">{children}</main>
        </RefreshProvider>
      </body>
    </html>
  );
}
