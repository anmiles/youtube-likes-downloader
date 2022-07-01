import fs from 'fs';
import path from 'path';
import paths from './paths';

export { getOutputDir, getDownloadArchive, getLikesFile, getProfilesFile, getSecretsFile, getCredentialsFile, ensureDir, ensureFile };
export default { getOutputDir, getDownloadArchive, getLikesFile, getProfilesFile, getSecretsFile, getCredentialsFile, ensureDir, ensureFile };

const dirPaths = {
	input   : 'input',
	output  : 'output',
	secrets : 'secrets',
};

function getOutputDir(profile: string): string {
	return paths.ensureDir(path.join(dirPaths.output, profile));
}

function getDownloadArchive(profile: string): string {
	return paths.ensureFile(path.join(dirPaths.input, `${profile}.ytdlp`));
}

function getLikesFile(profile: string): string {
	return paths.ensureFile(path.join(dirPaths.input, `${profile}.txt`));
}

function getProfilesFile() {
	return path.join(dirPaths.input, 'profiles.json');
}

function getSecretsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.json`);
}

function getCredentialsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.credentials.json`);
}

function ensureDir(dirPath: string) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive : true });
	}
	return dirPath;
}

function ensureFile(filePath: string) {
	paths.ensureDir(path.dirname(filePath));

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, '');
	}
	return filePath;
}
