import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { SITE_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-semibold text-foreground hover:text-foreground/80 transition-colors"
        >
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/posts"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            Posts
          </Link>
          <Link
            href="/about"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            Me
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
