"use client";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="border-b border-chrome border-6 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="bg-nani-blue text-2xl font-bold  flex items-center"
        >
          <span className="text-primary-highlight px-2 animate-glitch">
            @nanipilled
          </span>
        </Link>
        <ConnectButton />
      </div>
    </header>
  );
}
