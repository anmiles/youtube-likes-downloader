import path from 'path';
import execa from 'execa';
import { getOutputDir, getDownloadArchive } from './paths';

const executable = 'yt-dlp';

const flags = [
	'--output', '%(title)s [%(channel)s]',
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

export async function download(profile: string, likesFile: string): Promise<execa.ExecaChildProcess<string>> {
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
