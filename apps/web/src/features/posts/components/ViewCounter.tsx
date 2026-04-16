"use client";

import { useState, useEffect, useRef } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  slug: string;
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const hasIncremented = useRef(false);

  useEffect(() => {
    // React StrictMode 이중 실행 방지
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    fetch(`/api/views/${slug}`, { method: "POST" })
      .then(() => fetch(`/api/views/${slug}`))
      .then((res) => res.json())
      .then((data: { count: number }) => setCount(data.count))
      .catch(() => setCount(0));
  }, [slug]);

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Eye className="size-4" />
      {count === null ? (
        <span className="inline-block h-4 w-8 animate-pulse rounded bg-muted" />
      ) : (
        <span>{count.toLocaleString()}</span>
      )}
    </span>
  );
}
