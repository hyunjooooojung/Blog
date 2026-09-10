import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "content/posts");

/** frontmatter에 category가 없을 때 사용하는 기본 카테고리 */
export const DEFAULT_CATEGORY = "기타";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface Category {
  /** frontmatter에 적힌 표시 이름 (예: "Frontend") */
  name: string;
  /** URL 세그먼트 (예: "frontend") */
  slug: string;
  count: number;
}

/**
 * 카테고리 이름 → URL 세그먼트.
 * 소문자화 + 공백을 하이픈으로. 한글 등 유니코드 문자는 그대로 둔다
 * (Next.js가 dynamic params를 디코딩해서 넘겨주므로 비교 시 문제 없음).
 */
export function toCategorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function parsePost(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = matter(
    fs.readFileSync(path.join(postsDirectory, file), "utf8")
  );
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    category:
      typeof data.category === "string" && data.category.trim()
        ? data.category.trim()
        : DEFAULT_CATEGORY,
    tags: (data.tags as string[]) ?? [],
    readingTime: readingTime(content).text,
    content,
  };
}

function listPostFiles(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));
}

/** 목록에서는 본문이 필요 없으므로 메타데이터만 추린다 */
function toMeta(post: Post): PostMeta {
  const { slug, title, description, date, category, tags, readingTime } = post;
  return { slug, title, description, date, category, tags, readingTime };
}

export function getAllPosts(): PostMeta[] {
  return listPostFiles()
    .map((file) => toMeta(parsePost(file)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  return parsePost(`${slug}.md`);
}

export function getAllSlugs(): string[] {
  return listPostFiles().map((f) => f.replace(/\.md$/, ""));
}

/** 글 수 내림차순, 같으면 이름순으로 정렬된 카테고리 목록 */
export function getAllCategories(): Category[] {
  const map = new Map<string, Category>();
  for (const post of getAllPosts()) {
    const slug = toCategorySlug(post.category);
    const existing = map.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(slug, { name: post.category, slug, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko")
  );
}

export function getCategoryBySlug(slug: string): Category | null {
  return getAllCategories().find((c) => c.slug === slug) ?? null;
}

export function getPostsByCategory(categorySlug: string): PostMeta[] {
  return getAllPosts().filter(
    (post) => toCategorySlug(post.category) === categorySlug
  );
}
