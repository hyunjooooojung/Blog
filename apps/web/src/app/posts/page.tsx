import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/features/posts/lib/posts";

export const metadata: Metadata = {
  title: "글 목록",
  description: "작성한 글 전체 목록입니다.",
};

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-10">
        POSTS
      </h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">아직 작성된 글이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.slug} className="py-5">
              <Link href={`/posts/${post.slug}`} className="group block">
                <article>
                  <h2 className="font-medium text-foreground group-hover:text-foreground/80 transition-colors mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{post.date}</time>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
