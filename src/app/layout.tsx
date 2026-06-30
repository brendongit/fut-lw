import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fut Manager",
  description: "Gerencie suas peladas com facilidade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-[var(--background)]">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--background-secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
