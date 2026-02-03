import fs from 'fs';
import path from 'path';

import { config } from './config';
import '@anmiles/prototypes';
import { Cli } from './utils/cli';
import { formatJSON } from './utils/formatJSON';
import { formatTitle } from './utils/formatTitle';
import { getDownloadArchive, getOutputDir } from './utils/paths';

export async function addVideo(profile: string): Promise<void> {
	const cli = new Cli();

	const id         = await getID(cli);
	const channel    = await getChannel(cli);
	const title      = await getTitle(cli);
	const duration   = await getDuration(cli);
	const resolution = await getResolution(cli);
	const epoch      = await getEpoch(cli);

	const videoFile       = await getVideoFile(cli);
	const imageFile       = await getImageFile(cli);
	const descriptionFile = await getDescriptionFile(cli);

	cli.close();

	const ext = path.extname(videoFile).slice(1);

	const outputDir = getOutputDir(profile);
	fs.ensureDir(outputDir, { create: true });

	const filename = path.join(outputDir, `${formatTitle({ id, title, channel }).toFilename()}`);
	const json     = formatJSON({ id, title, channel, ext, resolution, duration, epoch });

	await fs.promises.writeFile(`${filename}.info.json`, JSON.stringify(json));

	await fs.promises.copyFile(path.resolve(videoFile), filename + path.extname(videoFile));
	await fs.promises.copyFile(path.resolve(imageFile), filename + path.extname(imageFile));
	await fs.promises.copyFile(path.resolve(descriptionFile), `${filename}.description`);

	await fs.promises.appendFile(getDownloadArchive(profile), `youtube ${id}\n`);
}

async function getID(cli: Cli): Promise<string> {
	const regex = `^${config.urlPrefix.regexEscape()}(.+?)(&|$)`;

	return cli.getAnswer('Youtube link', (answer) => {
		const match = answer.match(regex);

		if (!match) {
			return new Error(`Youtube link should be in the format ${config.urlPrefix}...`);
		}

		return match.toTuple(3)[1];
	});
}

async function getChannel(cli: Cli): Promise<string> {
	return cli.getAnswer('Channel', (answer) => answer);
}

async function getTitle(cli: Cli): Promise<string> {
	return cli.getAnswer('Title', (answer) => answer);
}

async function getDuration(cli: Cli): Promise<string> {
	const regex = /^\d\d?(:\d\d)+$/;

	return cli.getAnswer('Duration', (answer) => {
		const match = answer.match(regex);

		if (!match) {
			return new Error('Duration should be in the format <min>:<sec> or <hour>:<min>:<sec>');
		}

		return answer;
	});
}

async function getResolution(cli: Cli): Promise<[number, number]> {
	const regex = /^(\d+)[xх](\d+)$/;

	return cli.getAnswer('Resolution', (answer) => {
		const match = answer.match(regex);

		if (!match) {
			return new Error('Resolution should be in the format <width>x<height>');
		}

		return match.slice(1).map((d) => parseInt(d)).toTuple(2);
	});
}

async function getEpoch(cli: Cli): Promise<number> {
	const format = 'YYYY-MM-dd';
	const regex  = /^(\d{4})-(\d{2})-(\d{2})$/;

	return cli.getAnswer('Date', (answer) => {
		const match = answer.match(regex);

		if (!match) {
			return new Error(`Date should be in the format ${format}`);
		}

		return Math.round(new Date(match[1]!).getTime() / 1000);
	});
}

async function getVideoFile(cli: Cli): Promise<string> {
	return cli.getAnswer('Video file', (answer) => {
		const { exists } = fs.ensureFile(answer, { create: false });

		if (!exists) {
			return new Error('File not exists');
		}

		return answer;
	});
}

async function getImageFile(cli: Cli): Promise<string> {
	return cli.getAnswer('Image file', (answer) => {
		const { exists } = fs.ensureFile(answer, { create: false });

		if (!exists) {
			return new Error('File not exists');
		}

		return answer;
	});
}

async function getDescriptionFile(cli: Cli): Promise<string> {
	return cli.getAnswer('Description file', (answer) => {
		const { exists } = fs.ensureFile(answer, { create: false });

		if (!exists) {
			return new Error('File not exists');
		}

		return answer;
	});
}
