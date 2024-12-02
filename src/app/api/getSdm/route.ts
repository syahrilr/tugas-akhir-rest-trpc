export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prismadb from "../../../../lib/prismadb";
import { verifyJwt } from "../../../../lib/jwt";
import { redis } from "../../../../lib/redis"; // Import Redis

export async function GET(req: Request) {
    try {
        const accessToken = req.headers.get('Authorization');

        if (!accessToken) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Unauthorized: Token tidak ditemukan"
            }, {
                status: 401
            });
        }

        const decodedAccessToken = verifyJwt(accessToken);

        if (!decodedAccessToken) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Unauthorized: Token yang anda masukkan salah"
            }, {
                status: 401
            });
        }

        // Check Redis cache for the dosen data
        const cachedDosen = await redis.get('dosenData');

        // Log the type and value of cachedDosen to help diagnose the issue
        // console.log('[PEGAWAI] Cached Dosen:', cachedDosen);
        // console.log('[PEGAWAI] Type of cachedDosen:', typeof cachedDosen);

        return NextResponse.json({
            success: true,
            dosen: cachedDosen,
        }, {
            status: 200
        });

        // If data is not cached, fetch from the database
        const dosen = await prismadb.dosen.findMany();

        if (!dosen || dosen.length === 0) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Data dosen tidak ditemukan"
            }, {
                status: 404
            });
        }

        // Cache the fetched dosen data in Redis
        await redis.setex('dosenData', 60 * 60 * 24, JSON.stringify(dosen));
        console.log('[PEGAWAI] Data dosen telah disimpan di Redis');

        return NextResponse.json({
            success: true,
            data: dosen.length,
            dosen,
        }, {
            status: 200
        });

    } catch (error) {
        console.error('[PEGAWAI]', error);
        return new NextResponse('[PEGAWAI] Internal error', { status: 500 });
    }
}
