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


        // Check Redis cache for the dokumen data using id_sdm
        const cachedDokumen = await redis.get(`dokumenData:${id_sdm}`);

        if (cachedDokumen) {
            // If data is cached, return it
            console.log('[DOKUMEN] Data dokumen diambil dari Redis');

            return NextResponse.json({
                success: true,
                dokumen: cachedDokumen
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

        if (!dokumen || dokumen.length === 0) {
            return NextResponse.json({
                success: false,
                data: 0,
                message: "Data dokumen tidak ditemukan"
            }, {
                status: 404
            });
        }

        // Store the dokumen data in Redis with an expiration time (e.g., 24 hours)
        await redis.setex(`dokumenData:${id_sdm}`, 60 * 60 * 24, JSON.stringify(dokumen)); // Set expiry to 24 hours
        console.log('[DOKUMEN] Data dokumen disimpan di Redis');

        return NextResponse.json({
            success: true,
            data: dokumen.length,
            dokumen
        }, {
            status: 200
        });

    } catch (error) {
        console.error('[DOKUMEN] Error:', error);
        return new NextResponse('[DOKUMEN] Internal error', { status: 500 });
    }
}
