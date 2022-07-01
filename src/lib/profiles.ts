import fs from 'fs';
import { getJSON, writeJSON } from './jsonLib';
import { log, warn, error } from './logger';
import { getProfilesFile } from './paths';

import profiles from './profiles';

export { getProfiles, setProfiles, create, migrate, restrictOldFiles };
export default { getProfiles, setProfiles, create, migrate, restrictOldFiles };

const oldFiles = [ './secrets/credentials.json', './secrets/tokens.json', './input/favorites.json', './input/.ytdlp' ] as const;

function getProfiles(): string[] {
	const profilesFile = getProfilesFile();
	return getJSON(profilesFile, () => []);
}

function setProfiles(profiles: string[]): void {
	const profilesFile = getProfilesFile();
	writeJSON(profilesFile, profiles);
}

function create(profile: string): void {
	if (!profile) {
		error('Usage: `npm run create profile` where `profile` - is any profile name you want');
	}

	const existingProfiles = profiles.getProfiles();

	if (existingProfiles.includes(profile)) {
		return;
	}

	existingProfiles.push(profile);
	profiles.setProfiles(existingProfiles);
}

function migrate(profile: string): void {
	if (!profile) {
		error('Usage: `npm run migrate profile` where `profile` - is any profile name you want');
	}

	const renames: Array<{src: typeof oldFiles[number]; dst: string}> = [
		{ src : './secrets/credentials.json', dst : `./secrets/${profile}.json` },
		{ src : './secrets/tokens.json',	  dst : `./secrets/${profile}.credentials.json` },
		{ src : './input/favorites.json',	  dst : `./input/${profile}.txt` },
		{ src : './input/.ytdlp',			  dst : `./input/${profile}.ytdlp` },
	];

	if (renames.filter((rename) => fs.existsSync(rename.src)).length === 0) {
		error('There are no files to migrate');
	}

	profiles.create(profile);

	for (const rename of renames) {
		if (fs.existsSync(rename.src) && !fs.existsSync(rename.dst)) {
			log(`Moving '${rename.src}' to '${rename.dst}'...`);
			fs.renameSync(rename.src, rename.dst);
		}
	}

	warn(`Please move './output/' to './output/${profile}/' manually`);
}

function restrictOldFiles(): void {
	for (const file of oldFiles) {
		if (fs.existsSync(file)) {
			throw `Existing file ${file} is not compatible with new multi-profile support, please perform migration (see README.md)`;
		}
	}
}
