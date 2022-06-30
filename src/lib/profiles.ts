import fs from 'fs';
import { getJSON, writeJSON } from './jsonLib';
import { log, warn, error } from './logger';
import { getProfilesFile } from './paths';

import profiles from './profiles';

export { getProfiles, setProfiles, create, migrate };
export default { getProfiles, setProfiles, create, migrate };

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

	const renames = [
		{ src : './secrets/credentials.json', dst : `./secrets/${profile}.json` },
		{ src : './secrets/tokens.json',	  dst : `./secrets/${profile}.credentials.json` },
		{ src : './input/favorites.json',	  dst : `./input/${profile}.txt` },
		{ src : './input/.ytdlp',			  dst : `./input/${profile}.ytdlp` },
	];

	let renamesCount = 0;

	for (const rename of renames) {
		if (fs.existsSync(rename.src)) {
			if (fs.existsSync(rename.dst)) {
				error(`Cannot move '${rename.src}' to '${rename.dst}', probably data for profile '${profile}' already exists`);
			}

			renamesCount++;
		}
	}

	if (renamesCount === 0) {
		error('There are no files to migrate');
	}

	profiles.create(profile);

	for (const rename of renames) {
		if (fs.existsSync(rename.src)) {
			log(`Moving '${rename.src}' to '${rename.dst}'...`);
			fs.renameSync(rename.src, rename.dst);
		}
	}

	warn(`Please move './output/' to './output/${profile}/' manually`);
}
