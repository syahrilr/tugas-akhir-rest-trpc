/** @type {import('next').NextConfig} */
const nextConfig = {
    cacheHandler: process.env.NODE_ENV === 'production' ? require.resolve('./cache-handler.mjs') : undefined,
};

export default nextConfig;
