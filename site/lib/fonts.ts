import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";

export const serif = Chakra_Petch({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
}); // heading

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const mono = JetBrains_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
