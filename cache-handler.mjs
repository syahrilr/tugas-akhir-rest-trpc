import { createClient } from 'redis';
import { CacheHandler } from '@neshca/cache-handler';
import createLruCache from '@neshca/cache-handler/local-lru';
import createRedisCache from '@neshca/cache-handler/redis-strings';

CacheHandler.onCreation(async () => {
    const localCache = createLruCache({
        maxItemsNumber: 10000,
        maxItemSizeBytes: 1024 * 1024 * 250, // Limit to 250 MB
    });

    let redisCache;
    if (!process.env.KV_URL) {
        console.warn('KV_URL env is not set, using local cache only.');
    } else {
        try {
            const client = createClient({
                url: process.env.KV_URL,
            });

            client.on('error', (error) => {
                console.error('Redis error', error);
            });

            await client.connect();

            redisCache = createRedisCache({
                client,
                keyPrefix: `next-shared-cache-${process.env.NEXT_PUBLIC_BUILD_NUMBER}:`,
                timeoutMs: 5000,
            });
        } catch (error) {
            console.log(
                'Failed to initialize Redis cache, using local cache only.',
                error
            );
        }
    }

    return {
        handlers: [redisCache, localCache].filter(Boolean), // Remove undefined handlers
        ttl: {
            defaultStaleAge: process.env.NEXT_PUBLIC_CACHE_IN_SECONDS,
            estimateExpireAge: (staleAge) => staleAge,
        },
    };
});

export default CacheHandler;
