/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포를 위한 최적화 설정
  output: 'standalone',
  
  // 엄격한 타입 검사
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 서버 외부 패키지 설정
  serverExternalPackages: [],
  
  // 압축 최적화
  compress: true,
  
  // 파워팩 관련 최적화
  poweredByHeader: false,
};

export default nextConfig;
