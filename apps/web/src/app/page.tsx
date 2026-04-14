import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <section className="mb-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          {SITE_NAME}
        </h1>
        <p className="text-muted-foreground">{SITE_DESCRIPTION}</p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">최근 글</h2>
          <Link
            href="/posts"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            전체 보기 →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-muted-foreground text-sm">아직 작성된 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentPosts.map((post) => (
              <li key={post.slug} className="py-5">
                <Link href={`/posts/${post.slug}`} className="group block">
                  <article>
                    <h3 className="font-medium text-foreground group-hover:text-foreground/80 transition-colors mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <time dateTime={post.date}>{post.date}</time>
                      <span>·</span>
                      <span>{post.readingTime}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{post.tags.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
