import { z } from 'zod'

// Search type
const PersonSearchMetadata = z.object({
    page: z.number().default(1),
    offset: z.number().default(0),
    limit: z.number().default(10),
    reachedEnd: z.boolean().default(false),
    searchTerm: z.string().default(''),
    partialRender: z.boolean().default(false),
    recordCount: z.number().default(0),
})

export type PersonSearchMetadata = z.infer<typeof PersonSearchMetadata>

const PersonRecord = z.object({
    pid: z.coerce.number(),
    emplid: z.coerce.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    alternative_email: z.string().email().optional(),
    phone: z.string().optional(),
    vender_id: z.coerce.string().optional(),
    cuny_login: z.string().email().optional(),
    needs_pto: z.boolean().optional(),
    pto_session_id: z.coerce.number().optional(),
    needs_pmp: z.boolean().optional(),
    pmp_semester_id: z.number().optional(),
    is_cuny_employee: z.boolean().optional(),
    cuny_employment_id: z.number().optional(),
    cuny_employment_status: z.coerce.string().optional(),
    profile_image_url: z.string().url().optional(),
})

export type PersonRecord = z.infer<typeof PersonRecord>
