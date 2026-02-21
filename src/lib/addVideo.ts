import { randomUUID } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { open } from 'out-url';
import { z } from 'zod';

import type { dataSchema } from './types/schema';
import { durationSchema, epochSchema, fileSchema, inputDataSchema, resolutionSchema, stringSchema, youtubeIdSchema } from './types/schema';
import '@anmiles/prototypes';
import { Cli } from './utils/cli';
import { formatJSON } from './utils/formatJSON';
import { formatTitle } from './utils/formatTitle';
import { getDownloadArchive, getOutputDir } from './utils/paths';

type InputData = z.infer<typeof inputDataSchema>;
type Data = z.infer<typeof dataSchema>;

export async function addVideo(profile: string): Promise<void> {
	const cli = new Cli();

	const {
		id,
		title,
		channel,
		duration,
		resolution,
		epoch,
		videoFile,
		imageFile,
		descriptionFile,
	} = await getData(cli);

	cli.close();

	const ext = path.extname(videoFile).slice(1);

	const outputDir = getOutputDir(profile);
	fs.ensureDir(outputDir, { create: true });

	const filename = path.join(outputDir, `${formatTitle({ id, title, channel }).toFilename()}`);
	const json     = formatJSON({ id, title, channel, duration, resolution, epoch, ext });

	await fs.promises.writeFile(`${filename}.info.json`, JSON.stringify(json));

	await fs.promises.copyFile(path.resolve(videoFile), filename + path.extname(videoFile));
	await fs.promises.copyFile(path.resolve(imageFile), filename + path.extname(imageFile));
	await fs.promises.copyFile(path.resolve(descriptionFile), `${filename}.description`);

	await fs.promises.appendFile(getDownloadArchive(profile), `youtube ${id}\n`);
}

async function getData(cli: Cli): Promise<Data> {
	const data = await getJSONData(cli);

	if (data) {
		return data;
	}

	return {
		id             : await cli.getAnswer('Youtube link', youtubeIdSchema),
		title          : await cli.getAnswer('Title', stringSchema),
		channel        : await cli.getAnswer('Channel', stringSchema),
		duration       : await cli.getAnswer('Duration', durationSchema),
		resolution     : await cli.getAnswer('Resolution', resolutionSchema),
		epoch          : await cli.getAnswer('Date', epochSchema),
		videoFile      : await cli.getAnswer('Video file', fileSchema),
		imageFile      : await cli.getAnswer('Image file', fileSchema),
		descriptionFile: await cli.getAnswer('Description file', fileSchema),
	};
}

async function getJSONData(cli: Cli): Promise<Data | undefined> {
	const inputData = await cli.getAnswer('Input JSON (optional)', inputDataSchema.or(z.undefined()), JSON.parse);

	if (!inputData) {
		return undefined;
	}

	const videoFile = await cli.getAnswer('Video file', fileSchema);

	cli.say('Opening thumbnail; please download it as an image file');
	await open(inputData.thumbnail);
	const imageFile = await cli.getAnswer('Image file', fileSchema);

	const descriptionFile = createTempFilePath('txt');
	await fs.promises.writeFile(descriptionFile, inputData.description);

	return transformInputData(inputData, videoFile, imageFile, descriptionFile);
}

function createTempFilePath(ext: string): string {
	const tmp      = os.tmpdir();
	const filename = randomUUID();
	return path.join(tmp, `${filename}.${ext}`);
}

function transformInputData(inputData: InputData, videoFile: string, imageFile: string, descriptionFile: string): Data {
	return {
		id        : inputData.id,
		title     : inputData.title,
		channel   : inputData.channel,
		duration  : inputData.duration,
		resolution: inputData.resolution,
		epoch     : inputData.epoch,
		videoFile,
		imageFile,
		descriptionFile,
	};
}
