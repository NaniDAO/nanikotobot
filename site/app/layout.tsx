import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { sans, serif, mono } from "@/lib/fonts";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Providers } from "@/components/providers";

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
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            async
          />
        )}
      </head>
      <body
        className={cn(
          sans.variable,
          serif.variable,
          mono.variable,
          "font-mono bg-black text-foreground min-h-screen flex flex-col"
        )}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
