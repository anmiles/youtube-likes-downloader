import fs from 'fs';
import path from 'path';

import { log, warn } from '@anmiles/logger';
import '@anmiles/prototypes';
import execa from 'execa';

import { getDownloadArchive, getLikesFile, getOutputDir } from './utils/paths';

interface VideoInfo {
	id: string;
	title: string;
	channel: string;
}

const executable = 'yt-dlp';

const flags = [
	'--output', formatTitle({ id: '%(id)s', title: '%(title)s', channel: '%(channel)s' }),
	'--format-sort', 'vcodec:h264,acodec:mp3',
	'--merge-output-format', 'mp4',
	'--sponsorblock-remove', 'sponsor',
	'--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
	'--geo-bypass',
	'--no-playlist',
	'--no-overwrites',
	'--no-part',
	'--continue',
	'--abort-on-error',
	'--write-thumbnail',
	'--write-description',
	'--write-info-json',
];

function formatTitle({ id, title, channel }: VideoInfo): string {
	return `${title} [${channel}].${id}`;
}

export async function download(profile: string): Promise<execa.ExecaChildProcess> {
	const outputDir       = getOutputDir(profile);
	const likesFile       = getLikesFile(profile);
	const downloadArchive = getDownloadArchive(profile);

	fs.ensureDir(outputDir, { create: true });
	fs.ensureFile(likesFile, { create: true });
	fs.ensureFile(downloadArchive, { create: true });

	const args = [
		'--batch-file', path.resolve(likesFile),
		'--download-archive', path.resolve(downloadArchive),
		...flags,
	];

	const proc = execa(executable, args, { cwd: outputDir });
	proc.stdout?.pipe(process.stdout);

	const errors: string[] = [];
	proc.stderr?.on('data', (data) => {
		const text = data.toString('utf8');
		errors.push(text);
		process.stderr.write(data);
	});

	const result = await proc;

	if (errors.length > 0) {
		throw new Error(errors.join('\n'));
	}

	return result;
}

export function validate(profile: string): void {
	const outputDir = getOutputDir(profile);
	fs.ensureDir(outputDir, { create: true });
	const allFiles = {} as Record<string, { exts: string[]; newName: string | undefined }>;

	fs.recurse(outputDir, { file: (filepath, filename) => {
		let { name, ext } = path.parse(filename);

		if (ext === '.json') {
			name = name.replace(/\.info$/, '');
			ext  = `.info${ext}`;
		}

		const file = allFiles[name] ??= { exts: [], newName: undefined };
		file.exts.push(ext);

		if (ext === '.info.json') {
			const json   = fs.readJSON<VideoInfo>(filepath);
			const title  = formatTitle(json);
			file.newName = title.toFilename();
		}
	} }, { depth: 1 });

	Object.entries(allFiles).forEach(([ name, { exts, newName } ]) => {
		if (name !== newName) {
			warn('Rename');
			log(`\tOld name: ${name}`);
			log(`\tNew name: ${newName}`);

			for (const ext of exts) {
				const oldFile = path.join(outputDir, `${name}${ext}`);
				const newFile = path.join(outputDir, `${newName}${ext}`);
				fs.renameSync(oldFile, newFile);
			}
		}
	});
}
