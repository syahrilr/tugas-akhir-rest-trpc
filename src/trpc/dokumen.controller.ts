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

        // Check Redis cache for dokumen data
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
        await redis.set(`dokumenData:${paramsInput.id_sdm}`, JSON.stringify(dokumen));
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
