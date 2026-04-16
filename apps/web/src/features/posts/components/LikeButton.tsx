"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  slug: string;
}

const STORAGE_KEY = (slug: string) => `liked-${slug}`;

function getStoredLike(slug: string): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY(slug)) === "true";
  } catch {
    return false;
  }
}

function setStoredLike(slug: string) {
  try {
    localStorage.setItem(STORAGE_KEY(slug), "true");
  } catch {
    // private browsing 등 localStorage 불가 환경 무시
  }
}

export function LikeButton({ slug }: LikeButtonProps) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLiked(getStoredLike(slug));

    fetch(`/api/likes/${slug}`)
      .then((res) => res.json())
      .then((data: { count: number }) => setCount(data.count))
      .catch(() => setCount(0));
  }, [slug]);

  async function handleLike() {
    if (liked || isLoading) return;

    // 낙관적 UI — 즉시 반영
    setLiked(true);
    setCount((prev) => (prev ?? 0) + 1);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/likes/${slug}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setStoredLike(slug);
    } catch {
      // 실패 시 롤백
      setLiked(false);
      setCount((prev) => Math.max(0, (prev ?? 1) - 1));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={liked || isLoading}
      aria-label={liked ? "이미 좋아요를 눌렀습니다" : "좋아요"}
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2"
    >
      <Heart
        className={`size-4 transition-colors ${
          liked ? "fill-red-500 text-red-500" : ""
        }`}
      />
      {count === null ? (
        <span className="inline-block h-4 w-6 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-sm">{count.toLocaleString()}</span>
      )}
    </Button>
  );
}
