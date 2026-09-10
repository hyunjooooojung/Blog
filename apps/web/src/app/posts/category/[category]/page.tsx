import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllCategories,
  getAllPosts,
  getCategoryBySlug,
  getPostsByCategory,
} from "@/features/posts/lib/posts";
import { PostList } from "@/features/posts/components/PostList";
import { CategoryNav } from "@/features/posts/components/CategoryNav";

interface Props {
  params: Promise<{ category: string }>;
}

// 빌드 시 모든 카테고리 페이지를 정적 생성
export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const found = getCategoryBySlug(category);
  if (!found) return {};
  return {
    title: `${found.name} 글 목록`,
    description: `${found.name} 카테고리의 글 ${found.count}개`,
  };
}

export default async function CategoryPage({ params }: Props) {
  // Next.js 16: params는 Promise — 반드시 await 필요
  const { category } = await params;
  const found = getCategoryBySlug(category);
  if (!found) notFound();

  const posts = getPostsByCategory(found.slug);
  const categories = getAllCategories();
  const totalCount = getAllPosts().length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
        POSTS
        <span className="ml-3 text-lg font-normal text-muted-foreground">
          / {found.name}
        </span>
      </h1>
      <CategoryNav
        categories={categories}
        active={found.slug}
        totalCount={totalCount}
      />
      <PostList
        posts={posts}
        emptyMessage={`${found.name} 카테고리에 글이 없습니다.`}
      />
    </div>
  );
}
