import fs from 'fs';
import path from 'path';
import '@anmiles/prototypes';

export { getOutputDir, getDownloadArchive, getLikesFile, getIncludeLikesFile };
export default { getOutputDir, getDownloadArchive, getLikesFile, getIncludeLikesFile };

const dirPaths = {
	input  : 'input',
	output : 'output',
};

function getOutputDir(profile: string): string {
	const dir = path.join(dirPaths.output, profile);
	fs.ensureDir(dir, { create : true });
	return dir;
}

function getDownloadArchive(profile: string): string {
	const file = path.join(dirPaths.input, `${profile}.ytdlp`);
	fs.ensureFile(file, { create : true });
	return file;
}

function getLikesFile(profile: string): string {
	const file = path.join(dirPaths.input, `${profile}.txt`);
	fs.ensureFile(file, { create : true });
	return file;
}

function getIncludeLikesFile(profile: string): string {
	const file = path.join(dirPaths.input, `${profile}.include.txt`);
	fs.ensureFile(file, { create : true });
	return file;
}
