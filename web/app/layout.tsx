import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "MedTrail",
  description: "One timeline for your medical history. Demo data, not medical advice.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2f6f5e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#f8f9fa] text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
