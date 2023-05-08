import { getProfiles } from '@anmiles/google-api-wrapper';
import { info } from '@anmiles/logger';
import { download } from './downloader';
import { updateVideosData } from './videos';

export { run };
export default { run };

async function run(profile?: string): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	if (profiles.length === 0) {
		throw 'Please `npm run create` at least one profile';
	}

	for (const profile of profiles) {
		info(`Downloading ${profile}...`);
		await updateVideosData(profile);
		await download(profile);
	}

	info('Done!');
}

