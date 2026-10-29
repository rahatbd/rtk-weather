import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    basePath: process.env.NODE_ENV === 'production' ? '/rtk-weather' : '',
    output: 'export',
};

export default nextConfig;
