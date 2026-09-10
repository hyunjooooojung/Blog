import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { Options } from "rehype-pretty-code";
import CodeBlock from "@/features/posts/components/CodeBlock";

const prettyCodeOptions: Options = {
  theme: "github-dark-default",
  keepBackground: true,
};

export async function renderMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: { pre: CodeBlock },
    options: {
      mdxOptions: {
        // GFM: 표, 취소선, 자동 링크, 체크리스트
        remarkPlugins: [remarkGfm],
        // rehypeSlug을 먼저 실행해야 헤딩 ID가 생성됨
        rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  });
  return content;
}
