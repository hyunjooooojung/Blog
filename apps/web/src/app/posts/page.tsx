import type { Metadata } from "next";
import { getAllPosts, getAllCategories } from "@/features/posts/lib/posts";
import { PostList } from "@/features/posts/components/PostList";
import { CategoryNav } from "@/features/posts/components/CategoryNav";

export const metadata: Metadata = {
  title: "글 목록",
  description: "작성한 글 전체 목록입니다.",
};

export default function PostsPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
        POSTS
      </h1>
      <CategoryNav categories={categories} totalCount={posts.length} />
      <PostList posts={posts} />
    </div>
  );
}
