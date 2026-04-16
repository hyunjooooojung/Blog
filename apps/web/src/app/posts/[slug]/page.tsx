import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/features/posts/lib/posts";
import { renderMDX } from "@/features/posts/lib/mdx";
import { AUTHOR_NAME, SITE_URL } from "@/lib/constants";
import { ViewCounter } from "@/features/posts/components/ViewCounter";
import { LikeButton } from "@/features/posts/components/LikeButton";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${SITE_URL}/posts/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      url,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 16: params는 Promise — 반드시 await 필요
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const content = await renderMDX(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: AUTHOR_NAME },
    url: `${SITE_URL}/posts/${slug}`,
    keywords: post.tags,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <article>
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              {post.title}
            </h1>
            <p className="text-muted-foreground mb-4">{post.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={post.date}>{post.date}</time>
              <span>·</span>
              <span>{post.readingTime}</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-muted text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <ViewCounter slug={slug} />
              <span className="text-muted-foreground/40">·</span>
              <LikeButton slug={slug} />
            </div>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {content}
          </div>
        </article>
      </div>
    </>
  );
}
