import { filterProfiles } from '@anmiles/google-api-wrapper';
import { info } from '@anmiles/logger';
import { download, validate } from './downloader';
import { importLikes, exportLikes } from './videos';

async function run(profile?: string): Promise<void> {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Importing likes from ${foundProfile}...`);
		await importLikes(foundProfile);

		info(`Downloading videos from ${foundProfile}...`);
		await download(foundProfile);
	}

	info('Done!');
}

function check(profile?: string): void {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Validating filenames (${foundProfile})...`);
		validate(foundProfile);
	}

	info('Done!');
}

async function update(profile?: string): Promise<void> {
	for (const foundProfile of filterProfiles(profile)) {
		info(`Exporting likes into ${foundProfile}...`);
		await exportLikes(foundProfile);
	}

	info('Done!');
}

export { run, update, check };
export default { run, update, check };
