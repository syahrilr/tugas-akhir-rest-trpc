import { Redis } from '@upstash/redis';

const getRedisUrl = () => {
    if (process.env.KV_REST_API_URL) {
        return process.env.KV_REST_API_URL;
    }

    throw new Error('KV_REST_API_URL is not defined');
}

const getRedisToken = () => {
    if (process.env.KV_REST_API_TOKEN) {
        return process.env.KV_REST_API_TOKEN;
    }

    throw new Error('KV_REST_API_TOKEN is not defined');
}

// Initialize Redis client with the correct config
export const redis = new Redis({
    url: getRedisUrl(),         // Pass the Redis URL
    token: getRedisToken(),     // Pass the Redis token (if required)
});
