import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SITE_NAME } from "@/lib/constants";
import { getAllCategories, getAllPosts } from "@/features/posts/lib/posts";

const navLinkClass =
  "px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted";

const dropdownItemClass =
  "flex items-center justify-between rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:bg-muted transition-colors";

export function Header() {
  // 서버 컴포넌트 — 파일시스템에서 직접 카테고리를 읽는다
  const categories = getAllCategories();
  const totalCount = getAllPosts().length;

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
          {/* hover / focus-within 으로 열리는 순수 CSS 드롭다운 */}
          <div className="relative group">
            <Link
              href="/posts"
              className={`${navLinkClass} inline-flex items-center gap-1`}
              aria-haspopup="menu"
            >
              Posts
              <ChevronDown
                aria-hidden
                className="size-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
              />
            </Link>
            {/* pt-1 은 링크와 메뉴 사이 마우스 이동 시 hover가 끊기지 않게 하는 브리지 */}
            <div className="absolute left-0 top-full pt-1 invisible opacity-0 translate-y-1 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0">
              <ul
                role="menu"
                className="min-w-40 rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md"
              >
                <li role="none">
                  <Link role="menuitem" href="/posts" className={dropdownItemClass}>
                    <span>전체</span>
                    <span className="text-xs opacity-60">{totalCount}</span>
                  </Link>
                </li>
                {categories.length > 0 && (
                  <li role="separator" className="my-1 h-px bg-border" />
                )}
                {categories.map((c) => (
                  <li key={c.slug} role="none">
                    <Link
                      role="menuitem"
                      href={`/posts/category/${encodeURIComponent(c.slug)}`}
                      className={dropdownItemClass}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs opacity-60">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link href="/about" className={navLinkClass}>
            Me
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
