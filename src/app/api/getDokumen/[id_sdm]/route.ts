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

        console.log(id_sdm);

        // Check Redis cache for the dokumen data using id_sdm
        const cachedDokumen = await redis.get(`dokumenData:${id_sdm}`);

        if (cachedDokumen) {
            // If data is cached, return it
            console.log('[DOKUMEN] Data dokumen telah diambil dari Redis');

            const parsedDokumen = JSON.parse(cachedDokumen as string);
            return NextResponse.json({
                success: true,
                data: parsedDokumen.length,
                dokumen: parsedDokumen
            }, {
                status: 200
            });
        }

        // If data is not cached, fetch from the database
        const dokumen = await prismadb.dokumen.findMany({
            where: {
                id_sdm
            }
        });

        // Store the dokumen data in Redis without expiration time (or set expiry if needed)
        await redis.set(`dokumenData:${id_sdm}`, JSON.stringify(dokumen)); // No expiration
        console.log('[DOKUMEN] Data dokumen telah disimpan di Redis');

        return NextResponse.json({
            success: true,
            data: dokumen.length,
            dokumen
        }, {
            status: 200
        });

    } catch (error) {
        console.log('[DOKUMEN]', error);
        return new NextResponse('[DOKUMEN] Internal error', { status: 500 });
    }
}
