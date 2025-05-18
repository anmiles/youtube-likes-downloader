import path from 'path';

const dirPaths = {
	input : 'input',
	output: 'output',
};

export function getOutputDir(profile: string): string {
	return path.join(dirPaths.output, profile);
}

export function getDownloadArchive(profile: string): string {
	return path.join(dirPaths.input, `${profile}.ytdlp`);
}

export function getLikesFile(profile: string): string {
	return path.join(dirPaths.input, `${profile}.txt`);
}

export function getIncludeLikesFile(profile: string): string {
	return path.join(dirPaths.input, `${profile}.include.txt`);
}
