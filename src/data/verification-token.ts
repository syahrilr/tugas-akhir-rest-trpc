import prismadb from "../../lib/prismadb";
import { redis } from "../../lib/redis";

// Get the verification token by its actual token value
export const getVerificationTokenByToken = async (token: string) => {
    try {
        // Check Redis cache for the token
        const cachedToken = await redis.get(`verification_token:${token}`);
        if (cachedToken) {
            // Safely parse the cached token and handle potential parsing errors
            try {
                return JSON.parse(cachedToken as string);
            } catch (parseError) {
                console.error("Error parsing cached token:", parseError);
                return null; // If parsing fails, return null
            }
        }

        // If the token is not in the cache, fetch it from the database
        const verificationToken = await prismadb.verificationtoken.findUnique({
            where: { token },
        });

        if (verificationToken) {
            // Cache the token in Redis for 24 hours
            await redis.setex(
                `verification_token:${token}`,
                60 * 60 * 24, // 24 hours expiration
                JSON.stringify(verificationToken)
            );
        }

        return verificationToken;
    } catch (error) {
        console.error("Error fetching verification token by token:", error);
        return null; // Return null in case of any error
    }
};

// Get the verification token by email
export const getVerificationTokenByEmail = async (email: string) => {
    try {
        // Check Redis cache for the token associated with the email
        const cachedToken = await redis.get(`verification_email:${email}`);
        if (cachedToken) {
            // Safely parse the cached token and handle potential parsing errors
            try {
                return JSON.parse(cachedToken as string);
            } catch (parseError) {
                console.error("Error parsing cached token by email:", parseError);
                return null; // If parsing fails, return null
            }
        }

        // If the token is not in the cache, fetch it from the database
        const verificationToken = await prismadb.verificationtoken.findFirst({
            where: { email },
        });

        if (verificationToken) {
            // Cache the result in Redis for 24 hours
            await redis.setex(
                `verification_email:${email}`,
                60 * 60 * 24, // 24 hours expiration
                JSON.stringify(verificationToken)
            );
        }

        return verificationToken;
    } catch (error) {
        console.error("Error fetching verification token by email:", error);
        return null; // Return null in case of any error
    }
};
