import {z} from "zod"

export const params = z.object({
    id_sdm: z.string(),
    token: z.string().optional()
})

export const token = z.object({
    token: z.string()
})

export type ParamsInput = z.TypeOf<typeof params>
export type TokenInput = z.TypeOf<typeof token>