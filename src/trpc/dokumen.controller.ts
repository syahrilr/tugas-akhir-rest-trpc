import { TRPCError } from "@trpc/server"
import prismadb from "../../lib/prismadb"
import { ParamsInput, TokenInput } from "./trpc.schema"

export const findDokumenSdm = async ({
    paramsInput,
}: {
    paramsInput: ParamsInput,
}) => {
    try {
        const token = await prismadb.verificationToken.findFirst({
            where: {
                token: paramsInput.token
            }
        })

        if (!token) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token tidak valid"
            })
        }

        if (token.expires < new Date()) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token sudah kadaluarsa"
            })
        }

        const dokumen = await prismadb.dokumen.findMany({
            where:
            {
                id_sdm: paramsInput.id_sdm
            }
        })


        if (!dokumen) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "dokumen tidak ditemukan"
            })
        }

        return {
            status: "success",
            result: dokumen.length,
            dokumen
        }
    } catch (error) {
        throw error
    }
}