import fs from 'fs';
import path from 'path';

const filePaths = {
	input   : 'input',
	output  : 'output',
	secrets : 'secrets',
};

export function getOutputDir(profile: string): string {
	const outputDir = path.join(filePaths.output, profile);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}
	return outputDir;
}

export function getDownloadArchive(profile: string): string {
	const downloadArchive = path.join(filePaths.input, `${profile}.ytdlp`);
	if (!fs.existsSync(downloadArchive)) {
		fs.writeFileSync(downloadArchive, '');
	}
	return downloadArchive;
}

export function getLikesFile(profile: string): string {
	const likesFile = path.join(filePaths.input, `${profile}.txt`);
	if (!fs.existsSync(likesFile)) {
		fs.writeFileSync(likesFile, '');
	}
	return likesFile;
}

export function getProfilesFile() {
	return path.join(filePaths.input, 'profiles.json');
}

export function getSecretsFile(profile: string) {
	return path.join(filePaths.secrets, `${profile}.json`);
}

export function getCredentialsFile(profile: string) {
	return path.join(filePaths.secrets, `${profile}.credentials.json`);
}
