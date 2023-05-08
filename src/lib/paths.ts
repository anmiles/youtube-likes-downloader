import fs from 'fs';
import path from 'path';
import '@anmiles/prototypes';

export { getOutputDir, getDownloadArchive, getLikesFile };
export default { getOutputDir, getDownloadArchive, getLikesFile };

const dirPaths = {
	input  : 'input',
	output : 'output',
};

function getOutputDir(profile: string): string {
	return fs.ensureDir(path.join(dirPaths.output, profile));
}

function getDownloadArchive(profile: string): string {
	return fs.ensureFile(path.join(dirPaths.input, `${profile}.ytdlp`));
}

function getLikesFile(profile: string): string {
	return fs.ensureFile(path.join(dirPaths.input, `${profile}.txt`));
}
