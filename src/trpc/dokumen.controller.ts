import { TRPCError } from "@trpc/server";
import prismadb from "../../lib/prismadb";
import { ParamsInput } from "./trpc.schema";
import { redis } from "../../lib/redis"; // Import Redis client

export const findDokumenSdm = async ({
    paramsInput,
}: {
    paramsInput: ParamsInput,
}) => {
    try {
        // Ensure token is provided
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

        // Check Redis cache for the dokumen data
        const cachedDokumen = await redis.get(`dokumenData:${paramsInput.id_sdm}`);

        if (cachedDokumen) {
            // If data is cached, return it
            console.log('[DOKUMEN] Data telah diambil dari Redis');

            const parsedDokumen = JSON.parse(cachedDokumen);
            return {
                status: "success",
                result: parsedDokumen.length,
                dokumen: parsedDokumen,
            };
        }

        // If data is not cached, fetch from the database
        const dokumen = await prismadb.dokumen.findMany({
            where: {
                id_sdm: paramsInput.id_sdm
            }
        });

        if (!dokumen || dokumen.length === 0) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Dokumen tidak ditemukan"
            });
        }

        // Store the dokumen data in Redis with an optional expiration time
        await redis.setex(`dokumenData:${paramsInput.id_sdm}`, 60 * 60 * 24, JSON.stringify(dokumen));
        console.log('[DOKUMEN] Data telah disimpan di Redis');

        return {
            status: "success",
            result: dokumen.length,
            dokumen,
        };
    } catch (error) {
        throw error;
    }
};
