import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/features/posts/lib/posts";

interface CategoryNavProps {
  categories: Category[];
  /** 현재 선택된 카테고리 slug. 없으면 "전체"가 활성 */
  active?: string;
  totalCount: number;
}

const chipBase =
  "px-3 py-1 rounded-full text-sm transition-colors border";
const chipInactive =
  "border-border text-muted-foreground hover:text-foreground hover:bg-muted";
const chipActive = "border-foreground bg-foreground text-background";

export function CategoryNav({ categories, active, totalCount }: CategoryNavProps) {
  return (
    <nav aria-label="카테고리" className="flex flex-wrap gap-2 mb-8">
      <Link
        href="/posts"
        aria-current={active ? undefined : "page"}
        className={cn(chipBase, active ? chipInactive : chipActive)}
      >
        전체 <span className="opacity-60">{totalCount}</span>
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/posts/category/${encodeURIComponent(c.slug)}`}
          aria-current={active === c.slug ? "page" : undefined}
          className={cn(chipBase, active === c.slug ? chipActive : chipInactive)}
        >
          {c.name} <span className="opacity-60">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
