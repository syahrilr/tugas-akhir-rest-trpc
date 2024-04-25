import { NextResponse } from 'next/server';
import prismadb from '../../../../../lib/prismadb';
import { verifyJwt } from '../../../../../lib/jwt';

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


        const dokumen = await prismadb.dokumen.findMany({
            where: {
                id_sdm
            }
        })
        return NextResponse.json({
            success: true,
            data: dokumen.length,
            dokumen
        }, {
            status: 200
        });
    } catch (error) {
        console.log('[DOKUMEN]', error);
        return new NextResponse('[DOKUMEN] Internal error', { status: 500 })
    }
}