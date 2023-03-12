import fs from 'fs';
import path from 'path';
import paths from './paths';

export { ensureDir, ensureFile, getOutputDir, getDownloadArchive, getLikesFile };
export default { ensureDir, ensureFile, getOutputDir, getDownloadArchive, getLikesFile };

const dirPaths = {
	input  : 'input',
	output : 'output',
};

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

function getOutputDir(profile: string): string {
	return paths.ensureDir(path.join(dirPaths.output, profile));
}

function getDownloadArchive(profile: string): string {
	return paths.ensureFile(path.join(dirPaths.input, `${profile}.ytdlp`));
}

function getLikesFile(profile: string): string {
	return paths.ensureFile(path.join(dirPaths.input, `${profile}.txt`));
}
