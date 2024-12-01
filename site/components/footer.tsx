import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { linkClass } from "@/lib/styles";

export default function Footer() {
  return (
    <footer className="border-t bg-white border-chrome py-2">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <nav className="flex space-x-4">
            <Link
              href={siteConfig.links.twitter}
              className="text-black hover:scale-110 transition-transform"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter size={20} />
            </Link>
            <Link
              href={siteConfig.links.warpcast}
              className="text-black hover:scale-110 transition-transform"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-5 h-5">
                <Image
                  src="/icons/warpcast.svg"
                  alt="Warpcast"
                  width={20}
                  height={20}
                  className="text-black"
                />
              </div>
            </Link>
            <Link
              href={siteConfig.links.github}
              className="text-black hover:scale-110 transition-transform"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} />
            </Link>
          </nav>
          <Link
            href="https://etherscan.io/token/0x00000000000007c8612ba63df8ddefd9e6077c97"
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            the ticker is ⌘
          </Link>
        </div>
      </div>
    </footer>
  );
}
