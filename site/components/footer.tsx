import Link from "next/link";
import { Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-chrome py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-chrome mb-4 md:mb-0">
            © 2023 NaniPilled Corp. All rights reserved.
          </div>
          <nav className="flex space-x-4">
            <Link
              href="#"
              className="text-chrome hover:text-white transition-colors"
            >
              <Twitter size={20} />
            </Link>
            <Link
              href="#"
              className="text-chrome hover:text-white transition-colors"
            >
              <Github size={20} />
            </Link>
            <Link
              href="#"
              className="text-chrome hover:text-white transition-colors"
            >
              <Linkedin size={20} />
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
