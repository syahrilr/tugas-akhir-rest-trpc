import { TRPCError } from "@trpc/server"
import prismadb from "../../lib/prismadb"
import { ParamsInput } from "./trpc.schema"

export const findPendidikanFormal = async ({
    paramsInput
}: {
    paramsInput: ParamsInput
}) => {
    try {
        const token = await prismadb.verificationtoken.findFirst({
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
        
        const pendidikan_formal = await prismadb.pendidikan_formal.findMany({
            where:
            {
                id_sdm: paramsInput.id_sdm
            }
        })

        return {
            status: "success",
            result: pendidikan_formal.length,
            pendidikan_formal
        }
    } catch (error) {
        throw error
    }
}