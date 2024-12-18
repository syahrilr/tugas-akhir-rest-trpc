export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prismadb from '../../../../../lib/prismadb';
import { verifyJwt } from '../../../../../lib/jwt';
import { redis } from '../../../../../lib/redis'; // Import Redis client

export async function GET(req: Request, { params }: { params: { id_sdm: string } }) {
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

        const { id_sdm } = params;

        if (!id_sdm) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Bad Request: id_sdm tidak boleh kosong"
            }, {
                status: 400
            });
        }


        // Check Redis cache for the pendidikan data using id_sdm
        const cachedPendidikan = await redis.get(`pendidikanData:${id_sdm}`);

        if (cachedPendidikan) {
            // If data is cached, return it
            console.log('[PEGAWAI] Data pendidikan diambil dari Redis');

            return NextResponse.json({
                success: true,
                pendidikan: cachedPendidikan
            }, {
                status: 200
            });
        }

        // If data is not cached, fetch from the database
        const pendidikan = await prismadb.pendidikan_formal.findMany({
            where: {
                id_sdm
            }
        });

        if (!pendidikan || pendidikan.length === 0) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Data pendidikan tidak ditemukan"
            }, {
                status: 404
            });
        }

        // Store the pendidikan data in Redis with an expiration time (e.g., 24 hours)
        await redis.setex(`pendidikanData:${id_sdm}`, 60 * 60 * 24, JSON.stringify(pendidikan)); // Set expiry to 24 hours
        console.log('[PEGAWAI] Data pendidikan disimpan di Redis');

        return NextResponse.json({
            success: true,
            data: pendidikan.length,
            pendidikan
        }, {
            status: 200
        });

    } catch (error) {
        console.error('[PEGAWAI] Error:', error);
        return new NextResponse('[PEGAWAI] Internal error', { status: 500 });
    }
}
