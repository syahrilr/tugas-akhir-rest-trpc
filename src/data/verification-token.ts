import prismadb from "../../lib/prismadb";

import { redis } from "../../lib/redis";

export const getVerificationTokenByToken = async (token: string) => {
    try {
        // Check Redis cache
        const cachedToken = await redis.get(`verification_token:${token}`);
        if (cachedToken) return JSON.parse(cachedToken);

        // Fallback to database query
        const verificationToken = await prismadb.verificationtoken.findUnique({
            where: { token },
        });

        if (verificationToken) {
            // Cache the result in Redis for 24 hours
            await redis.setex(
                `verification_token:${token}`,
                60 * 60 * 24, // Expire in 24 hours
                JSON.stringify(verificationToken)
            );
        }

        return verificationToken;
    } catch {
        return null;
    }
};


export const getVerificationTokenByEmail = async (email: string) => {
    try {
        // Check Redis cache
        const cachedToken = await redis.get(`verification_email:${email}`);
        if (cachedToken) return JSON.parse(cachedToken);

        // Fallback to database query
        const verificationToken = await prismadb.verificationtoken.findFirst({
            where: { email },
        });

        if (verificationToken) {
            // Cache the result in Redis for 24 hours
            await redis.setex(
                `verification_email:${email}`,
                60 * 60 * 24,
                JSON.stringify(verificationToken)
            );
        }

        return verificationToken;
    } catch {
        return null;
    }
};