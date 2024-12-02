import { TRPCError } from "@trpc/server";
import prismadb from "../../lib/prismadb";
import { verifyJwt } from "../../lib/jwt";
import { TokenInput } from "./trpc.schema";

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

        const token = await prismadb.verificationToken.findFirst({
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

        // Fetch data
        const pegawai = await prismadb.dosen.findMany({
        });

        return {
            status: "success",
            result: pegawai.length,
            pegawai,
        };
    } catch (error) {
        throw error;
    }
};
