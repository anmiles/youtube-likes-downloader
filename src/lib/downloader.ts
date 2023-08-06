import path from 'path';
import fs from 'fs';
import execa from 'execa';
import { log, warn } from '@anmiles/logger';
import { getLikesFile, getOutputDir, getDownloadArchive } from './paths';
import '@anmiles/prototypes';

export { download, validate };
export default { download, validate };

const executable = 'yt-dlp';

const flags = [
	'--output', formatTitle({ title : '%(title)s', channel : '%(channel)s' }),
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
	'--verbose',
	'--write-thumbnail',
	'--write-description',
	'--write-info-json',
];

function formatTitle({ title, channel }: { title: string, channel: string }): string {
	return `${title} [${channel}]`;
}

async function download(profile: string): Promise<execa.ExecaChildProcess<string>> {
	const likesFile       = getLikesFile(profile);
	const outputDir       = getOutputDir(profile);
	const downloadArchive = getDownloadArchive(profile);

	const args = [
		'--batch-file', path.resolve(likesFile),
		'--download-archive', path.resolve(downloadArchive),
		...flags,
	];

	const proc = execa(executable, args, { cwd : outputDir });
	proc.stdout?.pipe(process.stdout);
	return proc;
}

function validate(profile: string) {
	const outputDir = getOutputDir(profile);
	const allFiles  = {} as Record<string, { exts: string[], newName: string}>;

	fs.recurse(outputDir, { file : (filepath, filename) => {
		let { name, ext } = path.parse(filename);

		if (ext === '.json') {
			name = name.replace(/\.info$/, '');
			ext  = `.info${ext}`;
		}

		allFiles[name] = allFiles[name] || { exts : [] };
		allFiles[name].exts.push(ext);

		if (ext === '.info.json') {
			const json             = fs.readJSON(filepath);
			const title            = formatTitle(json);
			allFiles[name].newName = title.toFilename();
		}
	} }, 1);

	for (const name in allFiles) {
		const { newName, exts } = allFiles[name];

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
	}
}
