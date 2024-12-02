import { NextResponse } from "next/server";
import prismadb from "../../../../lib/prismadb";            
import { verifyJwt } from "../../../../lib/jwt";


export async function GET(req: Request) {


    try {
        const accessToken = req.headers.get('Authorization');

        if (!accessToken) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Unauthorized"
            }, {
                status: 401
            });
        }


        const decodedAccessToken = verifyJwt(accessToken);

        if (!decodedAccessToken) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Unauthorized Token yang anda masukkan salah"
            }, {
                status: 401
            });
        }


        const dosen = await prismadb.dosen.findMany();
        return NextResponse.json({
            success: true,
            data: dosen.length,
            dosen,
        }, {
            status: 200
        })


    } catch (error) {
        console.log('[PEGAWAI]', error);
        return new NextResponse('[PEGAWAI] Internal error', { status: 500 })
    }
}