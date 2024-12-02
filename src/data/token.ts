import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";



import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import prismadb from "../../lib/prismadb";
import { getVerificationTokenByEmail } from "./verification-token";


export const generatePasswordResetToken = async (email: string) => {
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await getPasswordResetTokenByEmail(email);

    if (existingToken) {
        await prismadb.passwordresettoken.delete({
            where: { id: existingToken.id }
        });
    }

    const passwordResetToken = await prismadb.passwordresettoken.create({
        data: {
            id: uuidv4(),
            email,
            token,
            expires
        }
    });

    return passwordResetToken;
}

export const generateVerificationToken = async (email: string) => {
    const expires = new Date(new Date().getTime() + 3600 * 1000);
    if(!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set")
    
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: 60 })

    const existingToken = await getVerificationTokenByEmail(email);

    if (existingToken) {
        await prismadb.verificationtoken.delete({
            where: {
                id: existingToken.id,
            },
        });
    }

    const verficationToken = await prismadb.verificationtoken.create({
        data: {
            id: uuidv4(),
            email,
            token,
            expires,
        }
    });

    return verficationToken;
};
