import Link from "next/link";
import { Pill, Zap, Cpu } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-chrome p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-chrome flex items-center"
        >
          <span className="text-cyan-500">@nanipilled</span>
        </Link>
      </div>
    </header>
  );
}
