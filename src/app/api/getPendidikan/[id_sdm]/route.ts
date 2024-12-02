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

        const id_sdm = params.id_sdm;

        if (!id_sdm) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "id_sdm tidak boleh kosong"
            }, {
                status: 400
            });
        }

        // Check Redis cache for the pendidikan data using id_sdm
        const cachedPendidikan = await redis.get(`pendidikanData:${id_sdm}`);

        if (cachedPendidikan) {
            // If data is cached, return it
            console.log('[PEGAWAI] Data pendidikan telah diambil dari Redis');

            const parsedPendidikan = JSON.parse(cachedPendidikan as string);
            return NextResponse.json({
                success: true,
                data: parsedPendidikan.length,
                pendidikan: parsedPendidikan
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

        // Store the pendidikan data in Redis without expiration time (or set expiry if needed)
        await redis.set(`pendidikanData:${id_sdm}`, JSON.stringify(pendidikan)); // No expiration
        console.log('[PEGAWAI] Data pendidikan telah disimpan di Redis');

        return NextResponse.json({
            success: true,
            data: pendidikan.length,
            pendidikan
        }, {
            status: 200
        });

    } catch (error) {
        console.log('[PEGAWAI]', error);
        return new NextResponse('[PEGAWAI] Internal error', { status: 500 });
    }
}
