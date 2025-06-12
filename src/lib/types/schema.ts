import z from 'zod';

export const commonErrorSchema = z.object({
	errors: z.null().or(z.array(z.unknown())),
});

export const errorSchema = z.object({
	errors: z.array(
		z.object({
			reason : z.string().optional(),
			message: z.string().optional(),
		}),
	),
});

