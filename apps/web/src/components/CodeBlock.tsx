"use client";

import { useRef, useState } from "react";

export default function CodeBlock(
  props: React.ComponentPropsWithoutRef<"pre">
) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = ref.current?.querySelector("code")?.innerText ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative group">
      <pre ref={ref} {...props} />
      <button
        onClick={handleCopy}
        aria-label="코드 복사"
        className="absolute top-3 right-3 px-2 py-1 text-xs rounded bg-zinc-700 text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}
