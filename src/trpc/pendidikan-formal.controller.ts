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
        // Ensure token is not undefined before using it
        if (!paramsInput.token) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Token tidak ditemukan"
            });
        }

        // Check Redis cache for the verification token
        const cachedToken = await redis.get(paramsInput.token);

        if (!cachedToken) {
            // If the token is not in Redis, check the database
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

            // Cache the token in Redis with an expiration time (e.g., 24 hours)
            await redis.setex(paramsInput.token, 60 * 60 * 24, JSON.stringify(token));
            console.log('[VERIFICATION TOKEN] Token disimpan di Redis');
        } else {
            console.log('[VERIFICATION TOKEN] Token diambil dari Redis');
        }

        // Ensure id_sdm is not undefined before using it in Redis key
        if (!paramsInput.id_sdm) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "ID SDM tidak ditemukan"
            });
        }

        // Check Redis cache for the pendidikan_formal data
        const cachedPendidikan = await redis.get(`pendidikanData:${paramsInput.id_sdm}`);

        if (cachedPendidikan) {
            // If data is cached, check if it's a string before parsing
            let parsedPendidikan;
            if (typeof cachedPendidikan === "string") {
                try {
                    parsedPendidikan = JSON.parse(cachedPendidikan);
                } catch (parseError) {
                    console.error("Error parsing cached pendidikan data:", parseError);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Error parsing cached pendidikan data",
                    });
                }
            } else {
                // If it's already an object, no need to parse
                parsedPendidikan = cachedPendidikan;
            }

            console.log('[PENDIDIKAN DATA] Data telah diambil dari Redis');
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

        if (!pendidikan_formal || pendidikan_formal.length === 0) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Pendidikan formal tidak ditemukan"
            });
        }

        // Store the pendidikan_formal data in Redis with an optional expiration time
        await redis.setex(`pendidikanData:${paramsInput.id_sdm}`, 60 * 60 * 24, JSON.stringify(pendidikan_formal));
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
