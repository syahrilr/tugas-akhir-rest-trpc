import { TRPCError } from "@trpc/server";
import prismadb from "../../lib/prismadb";
import { verifyJwt } from "../../lib/jwt";
import { TokenInput } from "./trpc.schema";
import { redis } from "../../lib/redis"; // Import Redis client
import { get } from "@vercel/edge-config"; // Import Edge Config SDK

export const findAllPegawaiController = async ({ tokenInput }: { tokenInput: TokenInput }) => {
    const start = process.hrtime(); // Start time measurement

    try {
        // Verify the JWT
        const decodedToken = verifyJwt(tokenInput.token);

        if (!decodedToken) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token tidak valid",
            });
        }

        const token = await prismadb.verificationtoken.findFirst({
            where: { token: tokenInput.token },
        });

        if (!token || token.expires < new Date()) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token sudah kadaluarsa",
            });
        }

        // Fetch configuration from Edge Config (e.g., cache settings or keys)
        const cacheKey = await get('dosedData');  // Replace 'CACHE_KEY' with the actual key

        // Check Redis cache for the pegawai data
        const cachedPegawai = await redis.get(JSON.stringify(cacheKey));

        if (cachedPegawai) {
            // If data is cached, log and return it
            console.log('[PEGAWAI] Data pegawai telah diambil dari Redis');

            const end = process.hrtime(start); // End time measurement
            const ttfb = end[0] * 1000 + end[1] / 1000000; // Convert to milliseconds

            return {
                status: "success redis",
                ttfb: ttfb.toFixed(3), // Add TTFB to the response
                pegawai: cachedPegawai, // Parse the cached data
            };
        }

        // If data is not cached, fetch from the database
        const pegawai = await prismadb.dosen.findMany();

        // Store the pegawai data in Redis with optional expiry based on config
        await redis.set(JSON.stringify(cacheKey), JSON.stringify(pegawai));

        console.log('[PEGAWAI] Data pegawai telah disimpan di Redis');

        const end = process.hrtime(start); // End time measurement
        const ttfb = end[0] * 1000 + end[1] / 1000000; // Convert to milliseconds

        return {
            status: "success",
            result: pegawai.length,
            ttfb: ttfb.toFixed(3), // Add TTFB to the response
            pegawai,
        };
    } catch (error) {
        throw error;
    }
};
