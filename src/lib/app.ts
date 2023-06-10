import { getProfiles } from '@anmiles/google-api-wrapper';
import { info } from '@anmiles/logger';
import { download } from './downloader';
import { importLikes, exportLikes } from './videos';

export { run, update };
export default { run, update };

async function run(profile?: string): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	if (profiles.length === 0) {
		throw 'Please `npm run create` at least one profile';
	}

	for (const profile of profiles) {
		info(`Importing likes from ${profile}...`);
		await importLikes(profile);

		info(`Downloading videos from ${profile}...`);
		await download(profile);
	}

	info('Done!');
}

async function update(profile?: string): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	if (profiles.length === 0) {
		throw 'Please `npm run create` at least one profile';
	}

	for (const profile of profiles) {
		info(`Exporting likes into ${profile}...`);
		await exportLikes(profile);
	}

	info('Done!');
}

