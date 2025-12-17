import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Pages 최적화 설정 */

  // 이미지 최적화는 Cloudflare에서 처리
  images: {
    unoptimized: true,
  },

  // 서버리스 함수 크기 제한 완화
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;
