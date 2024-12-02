import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prismadb from "../../../../lib/prismadb";


export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name } = body

        if(!email || !password || !name) {
            return new NextResponse('Invalid fields', { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prismadb.user.create({
            data: {
                id: crypto.randomUUID(),
                name,
                email,
                password: hashedPassword
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.log('[REGISTER]', error);
        return new NextResponse('Internal error', { status: 500 })
    }
}