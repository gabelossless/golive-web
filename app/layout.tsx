import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import AuthProvider from "@/components/AuthProvider";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "VibeStream — Watch, Create & Go Viral",
  description: "The next-generation video platform for creators. Upload, go live, and build your audience.",
  keywords: ["streaming", "video", "shorts", "creators", "live", "VibeStream"],
  manifest: "/manifest.json",
  openGraph: {
    title: "VibeStream — Watch, Create & Go Viral",
    description: "The next-generation video platform for creators.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.variable}>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
