import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'travelorientalmindoro.ph',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.travelorientalmindoro.ph',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lakbay-v3.poggerss.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.made-in-china.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.coltonyacht.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.merryinflatables.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.jetskitoursperth.com.au',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i5.walmartimages.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
