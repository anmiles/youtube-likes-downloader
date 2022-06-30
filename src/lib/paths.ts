import fs from 'fs';
import path from 'path';

export { getOutputDir, getDownloadArchive, getLikesFile, getProfilesFile, getSecretsFile, getCredentialsFile };
export default { getOutputDir, getDownloadArchive, getLikesFile, getProfilesFile, getSecretsFile, getCredentialsFile };

const filePaths = {
	input   : 'input',
	output  : 'output',
	secrets : 'secrets',
};

function getOutputDir(profile: string): string {
	const outputDir = path.join(filePaths.output, profile);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}
	return outputDir;
}

function getDownloadArchive(profile: string): string {
	const downloadArchive = path.join(filePaths.input, `${profile}.ytdlp`);
	if (!fs.existsSync(downloadArchive)) {
		fs.writeFileSync(downloadArchive, '');
	}
	return downloadArchive;
}

function getLikesFile(profile: string): string {
	const likesFile = path.join(filePaths.input, `${profile}.txt`);
	if (!fs.existsSync(likesFile)) {
		fs.writeFileSync(likesFile, '');
	}
	return likesFile;
}

function getProfilesFile() {
	return path.join(filePaths.input, 'profiles.json');
}

function getSecretsFile(profile: string) {
	return path.join(filePaths.secrets, `${profile}.json`);
}

function getCredentialsFile(profile: string) {
	return path.join(filePaths.secrets, `${profile}.credentials.json`);
}
