import { TRPCError } from "@trpc/server"
import prismadb from "../../lib/prismadb"
import { TokenInput } from "./trpc.schema"

export const findAllPegawaiController = async ({
    tokenInput
}: {
    tokenInput: TokenInput
}) => {
    try {
        const token = await prismadb.verificationToken.findFirst({
            where: {
                token: tokenInput.token
            }
        })

        if(!token) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token tidak valid"
            })
        }

        if(token.expires < new Date()) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token sudah kadaluarsa"
            })
        }

        
        const pegawai = await prismadb.dosen.findMany()

        return {
            status: "success",
            result: pegawai.length,
            pegawai
        }    

    } catch (error) {
        throw error
    }
}