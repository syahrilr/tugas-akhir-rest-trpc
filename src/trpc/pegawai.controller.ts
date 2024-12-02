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

        // Check Redis cache for the pegawai data
        const cachedPegawai = await redis.get('dosenData');

        if (cachedPegawai) {
            // If data is cached, check if it's already a valid JSON object
            let parsedPegawai;
            if (typeof cachedPegawai === "string") {
                try {
                    parsedPegawai = JSON.parse(cachedPegawai);
                } catch (parseError) {
                    console.error("Error parsing cached pegawai data:", parseError);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Error parsing cached pegawai data",
                    });
                }
            } else {
                // If it's already an object, no need to parse
                parsedPegawai = cachedPegawai;
            }

            console.log('[PEGAWAI] Data pegawai telah diambil dari Redis');
            return {
                status: "success",
                result: parsedPegawai.length,
                pegawai: parsedPegawai,
            };
        }

        // If data is not cached, fetch from the database
        const pegawai = await prismadb.dosen.findMany();

        // Store the pegawai data in Redis without expiration time (or set expiry if needed)
        await redis.set('dosenData', JSON.stringify(pegawai));  // No expiration
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
