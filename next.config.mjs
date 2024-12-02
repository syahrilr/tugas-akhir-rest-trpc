/** @type {import('next').NextConfig} */
import { resolve } from 'path';

const nextConfig = {
    cacheHandler: process.env.NODE_ENV === 'production' ? resolve('./cache-handler.mjs') : undefined,
};

export default nextConfig;
