import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import type { Options } from "rehype-pretty-code";
import CodeBlock from "@/components/CodeBlock";

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
        // rehypeSlug을 먼저 실행해야 헤딩 ID가 생성됨
        rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  });
  return content;
}
