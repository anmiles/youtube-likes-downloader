import { filterProfiles } from '@anmiles/google-api-wrapper';
import { info } from '@anmiles/logger';

import { addVideo } from './addVideo';
import { download } from './download';
import { exportLikes, importLikes } from './likes';
import { validate } from './validate';

export async function run(profile?: string): Promise<void> {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Importing likes from ${foundProfile}...`);
		await importLikes(foundProfile);

		info(`Downloading videos from ${foundProfile}...`);
		await download(foundProfile);
	}

	info('Done!');
}

export function check(profile?: string): void {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Validating filenames (${foundProfile})...`);
		validate(foundProfile);
	}

	info('Done!');
}

export async function update(profile?: string): Promise<void> {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Exporting likes into ${foundProfile}...`);
		await exportLikes(foundProfile);
	}

	info('Done!');
}

export async function add(profile?: string): Promise<void> {
	if (!profile) {
		throw new Error('Video should be added to the particular profile; specify it as `npm add <profile>`');
	}

	for (const foundProfile of filterProfiles(profile)) {
		info(`Adding video for ${foundProfile}...`);
		await addVideo(foundProfile);
	}

	info('Done!');
}
