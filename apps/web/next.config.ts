import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo 루트를 명시해서 workspace 중복 감지 경고 제거
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
