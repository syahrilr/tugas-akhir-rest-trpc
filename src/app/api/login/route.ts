
import * as bcrypt from "bcrypt";
import prismadb from "../../../../lib/prismadb";
import { signJwtAccessToken } from "../../../../lib/jwt";

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
        const accessToken = signJwtAccessToken(userWithoutPass);


        await prismadb.verificationToken.create({
            data: {
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
    } else
        return new Response(
            JSON.stringify({
                message: "Unathenticated",
            }),
            {
                status: 401,
            }
        );
}