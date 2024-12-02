import { initTRPC } from "@trpc/server";
import superjson from "superjson"
import { findAllPegawaiController } from "./pegawai.controller";
import { findPendidikanFormal } from "./pendidikan-formal.controller";
import { params, token } from "./trpc.schema";
import { findDokumenSdm } from "./dokumen.controller";

const t = initTRPC.create({
    transformer: superjson
})

export const appRouter = t.router({
    getAllPegawai: t.procedure
        .input(token)
        .query(({ input }) => findAllPegawaiController({ tokenInput: input })),
    getPendidikanFormal: t.procedure
        .input(params)
        .query(({ input }) => findPendidikanFormal({ paramsInput: input })),
    getDokumenSdm: t.procedure
        .input(params)
        .query(({ input }) => findDokumenSdm({ paramsInput: input })),
})

export type AppRouter = typeof appRouter