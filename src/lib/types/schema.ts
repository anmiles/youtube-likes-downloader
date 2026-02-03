import z from 'zod';

export const videoInfoSchema = z.object({
	id     : z.string(),
	title  : z.string(),
	channel: z.string(),
	ext    : z.string(),
	epoch  : z.number(),
});

export const videoJSONSchema = videoInfoSchema.extend({
	width          : z.number(),
	height         : z.number(),
	resolution     : z.string(),
	duration_string: z.string(), // eslint-disable-line camelcase
	epoch          : z.number(),
});

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

