import prismadb from "../../lib/prismadb";

export const getVerificationTokenByToken = async (
    token: string
) => {
    try {
        const verificationToken = await prismadb.verificationtoken.findUnique({
            where: { token }
        });

        return verificationToken;
    } catch {
        return null;
    }
}

export const getVerificationTokenByEmail = async (
    email: string
) => {
    try {
        const verificationToken = await prismadb.verificationtoken.findFirst({
            where: { email }
        });

        return verificationToken;
    } catch {
        return null;
    }
}