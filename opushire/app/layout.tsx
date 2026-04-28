import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});


export const metadata: Metadata = {
  title: "OpusHire | Premium Student Job Portal",
  description: "Connect with high-growth tech companies and land your dream internship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${manrope.variable} font-display bg-background-dark text-slate-100 selection:bg-primary selection:text-white`}>
        <SmoothScrollProvider>
          <AuthProvider>
            <Navbar />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Footer />
          </AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
