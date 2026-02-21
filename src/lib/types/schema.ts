import fs from 'fs';

import z from 'zod';
import '@anmiles/prototypes';

import { config } from '../config';

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

const urlRegex        = /^https:\/\//;
const youtubeRegex    = new RegExp(`^${config.urlPrefix.regexEscape()}(.+?)(&|$)`);
const durationRegex   = /^\d\d?(:\d\d)+$/;
const resolutionRegex = /^(\d+)[xх](\d+)$/;
const dateRegex       = /^(\d{4})-(\d{2})-(\d{2})$/;

export const stringSchema = z.string();
export const numberSchema = z.number();

export const urlSchema = z
	.string()
	.regex(urlRegex, {
		message: 'URL should be in the format https://...',
	});

export const youtubeIdSchema = z
	.string()
	.regex(youtubeRegex, {
		message: `Youtube link should be in the format ${config.urlPrefix}...`,
	})
	.transform((value) => {
		const match = value.match(youtubeRegex)!;
		return match.toTuple(3)[1];
	});

export const durationSchema = z
	.string()
	.regex(durationRegex, {
		message: 'Duration should be in the format <min>:<sec> or <hour>:<min>:<sec>',
	});

export const resolutionSchema = z
	.string()
	.regex(resolutionRegex, {
		message: 'Resolution should be in the format <width>x<height>',
	})
	.transform((value) => {
		const match = value.match(resolutionRegex)!;
		return match.slice(1).map((d) => parseInt(d)).toTuple(2);
	});

export const epochSchema =  z
	.string()
	.regex(dateRegex, {
		message: 'Date should be in the format YYYY-MM-dd',
	})
	.transform((value) => {
		const match = value.match(dateRegex)!;
		return Math.round(new Date(match[1]!).getTime() / 1000);
	});

export const fileSchema = z
	.string()
	.refine((path) => fs.ensureFile(path, { create: false }).exists, {
		message: 'File not exists',
	});

export const inputDataSchema = z.object({
	id         : stringSchema,
	title      : stringSchema,
	channel    : stringSchema,
	duration   : durationSchema,
	resolution : resolutionSchema,
	epoch      : numberSchema,
	thumbnail  : urlSchema,
	description: stringSchema,
});

export const dataSchema = z.object({
	id             : youtubeIdSchema,
	title          : stringSchema,
	channel        : stringSchema,
	duration       : durationSchema,
	resolution     : resolutionSchema,
	epoch          : epochSchema,
	videoFile      : fileSchema,
	imageFile      : fileSchema,
	descriptionFile: fileSchema,
});

