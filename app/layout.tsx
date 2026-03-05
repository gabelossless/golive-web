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
  title: "GoLive — Watch, Stream & Connect",
  description: "The platform for streaming video and live content. Upload, go live, and connect with your community.",
  keywords: ["streaming", "video", "live", "creators", "twitch", "youtube", "GoLive"],
  openGraph: {
    title: "GoLive — Watch, Stream & Connect",
    description: "The platform for streaming video and live content.",
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
