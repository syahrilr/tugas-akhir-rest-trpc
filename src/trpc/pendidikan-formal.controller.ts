import { TRPCError } from "@trpc/server";
import prismadb from "../../lib/prismadb";
import { ParamsInput } from "./trpc.schema";
import { redis } from "../../lib/redis"; // Import Redis client

export const findPendidikanFormal = async ({
    paramsInput
}: {
    paramsInput: ParamsInput
}) => {
    try {
        // Verify token
        const token = await prismadb.verificationtoken.findFirst({
            where: {
                token: paramsInput.token
            }
        });

        if (!token) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token tidak valid"
            });
        }

        if (token.expires < new Date()) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token sudah kadaluarsa"
            });
        }

        // Check Redis cache for the pendidikan_formal data
        const cachedPendidikan = await redis.get(`pendidikanData:${paramsInput.id_sdm}`);

        if (cachedPendidikan) {
            // If data is cached, return it
            console.log('[PENDIDIKAN DATA] Data telah diambil dari Redis');

            const parsedPendidikan = JSON.parse(cachedPendidikan);
            return {
                status: "success",
                result: parsedPendidikan.length,
                pendidikan_formal: parsedPendidikan,
            };
        }

        // If data is not cached, fetch from the database
        const pendidikan_formal = await prismadb.pendidikan_formal.findMany({
            where: {
                id_sdm: paramsInput.id_sdm
            }
        });

        // Store the pendidikan_formal data in Redis with an optional expiration time
        await redis.set(`pendidikanData:${paramsInput.id_sdm}`, JSON.stringify(pendidikan_formal));
        console.log('[PENDIDIKAN DATA] Data telah disimpan di Redis');

        return {
            status: "success",
            result: pendidikan_formal.length,
            pendidikan_formal,
        };
    } catch (error) {
        throw error;
    }
};
