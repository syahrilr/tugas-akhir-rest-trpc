export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prismadb from "../../../../lib/prismadb";
import { verifyJwt } from "../../../../lib/jwt";
import { redis } from "../../../../lib/redis";  // Import Redis

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

        // Check Redis cache for the dosen data
        const cachedDosen = await redis.get('dosenData');

        if (cachedDosen) {
            // If data is cached, return it
            console.log('[PEGAWAI] Data dosen telah diambil dari Redis');
            
            const parsedDosen = JSON.parse(cachedDosen as string);
            return NextResponse.json({
                success: true,
                data: parsedDosen.length,
                dosen: parsedDosen,
            }, {
                status: 200
            });
        }
        // If data is not cached, fetch from database
        const dosen = await prismadb.dosen.findMany();

        await redis.set('dosenData', JSON.stringify(dosen)); 
        console.log('[PEGAWAI] Data dosen telah disimpan di Redis');
        

        return NextResponse.json({
            success: true,
            data: dosen.length,
            dosen,
        }, {
            status: 200
        });


    } catch (error) {
        console.log('[PEGAWAI]', error);
        return new NextResponse('[PEGAWAI] Internal error', { status: 500 });
    }
}
