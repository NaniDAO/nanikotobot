import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { GeistMono } from "geist/font/mono";

export const metadata = {
  title: "@nanipilled",
  description: "Gen Alpha Chrome Corpo-Goth High-Tech Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          GeistMono.className,
          "font-mono bg-black text-white min-h-screen flex flex-col"
        )}
      >
        {children}
      </body>
    </html>
  );
}
