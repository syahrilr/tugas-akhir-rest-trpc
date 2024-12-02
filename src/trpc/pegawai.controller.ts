import { TRPCError } from "@trpc/server";
import prismadb from "../../lib/prismadb";
import { verifyJwt } from "../../lib/jwt";
import { TokenInput } from "./trpc.schema";
import { redis } from "../../lib/redis"; // Import Redis client

export const findAllPegawaiController = async ({ tokenInput }: { tokenInput: TokenInput }) => {
    try {
        // Verify the JWT
        const decodedToken = verifyJwt(tokenInput.token);

        if (!decodedToken) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token tidak valid",
            });
        }

        // Check Redis cache for verification token
        const cachedToken = await redis.get(tokenInput.token);

        if (!cachedToken) {
            // If token is not in cache, check in the database
            const token = await prismadb.verificationtoken.findFirst({
                where: { token: tokenInput.token },
            });

            if (!token) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Token tidak valid",
                });
            }

            if (token.expires < new Date()) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Token sudah kadaluarsa",
                });
            }

            // Cache the token in Redis for future use
            await redis.setex(tokenInput.token, 60 * 60 * 24, JSON.stringify(token)); // Expires in 24 hours
            console.log('[VERIFICATION TOKEN] Token disimpan di Redis');
        } else {
            console.log('[VERIFICATION TOKEN] Token diambil dari Redis');
        }

        // Check Redis cache for Pegawai data
        const cachedPegawai = await redis.get('dosenData');

        if (cachedPegawai) {
            // If data is cached, return it
            console.log('[PEGAWAI] Data pegawai telah diambil dari Redis');

            const parsedPegawai = JSON.parse(cachedPegawai);
            return {
                status: "success",
                result: parsedPegawai.length,
                pegawai: parsedPegawai,
            };
        }

        // If data is not cached, fetch from the database
        const pegawai = await prismadb.dosen.findMany();

        // Store the pegawai data in Redis with an expiration time (optional)
        await redis.setex('dosenData', 60 * 60 * 24, JSON.stringify(pegawai));  // Expires in 24 hours
        console.log('[PEGAWAI] Data pegawai telah disimpan di Redis');

        return {
            status: "success",
            result: pegawai.length,
            pegawai,
        };
    } catch (error) {
        throw error;
    }
};
