import * as bcrypt from "bcrypt";
import prismadb from "../../../../lib/prismadb";
import { signJwtAccessToken } from "../../../../lib/jwt";
import { redis } from "../../../../lib/redis";  // Import Redis

interface RequestBody {
    username: string;
    password: string;
}

export async function POST(request: Request) {
    const body: RequestBody = await request.json();

    const user = await prismadb.user.findFirst({
        where: {
            email: body.username,
        },
    });

    if (user && user.password && (await bcrypt.compare(body.password, user.password))) {
        const { password, ...userWithoutPass } = user;

        // Ensure email is valid before using it as the Redis key
        const email = userWithoutPass.email;
        if (!email) {
            return new Response(
                JSON.stringify({ message: "Email is missing" }),
                { status: 400 }
            );
        }

        // Check if the access token is already cached in Redis
        const cachedToken = await redis.get(email); // Now safe to use email as Redis key

        let accessToken: string;

        if (cachedToken) {
            // Token exists in Redis, use it
            accessToken = cachedToken;
        } else {
            // Token does not exist, create a new one
            accessToken = signJwtAccessToken(userWithoutPass);

            // Store the new access token in Redis with a 24-hour expiration
            await redis.setex(email, 60 * 60 * 24, accessToken);  // key is user's email
        }

        // Store the verification token in the database
        await prismadb.verificationtoken.create({
            data: {
                id: crypto.randomUUID(),
                token: accessToken,
                email: userWithoutPass.email as string,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
        });

        const result = {
            ...userWithoutPass,
            accessToken,
        };
        return new Response(JSON.stringify(result));
    } else {
        return new Response(
            JSON.stringify({
                message: "Unauthenticated",
            }),
            {
                status: 401,
            }
        );
    }
}
