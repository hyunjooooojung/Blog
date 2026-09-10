import Link from "next/link";
import type { PostMeta } from "@/features/posts/lib/posts";

interface PostListProps {
  posts: PostMeta[];
  emptyMessage?: string;
}

export function PostList({
  posts,
  emptyMessage = "아직 작성된 글이 없습니다.",
}: PostListProps) {
  if (posts.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
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
  );
}
