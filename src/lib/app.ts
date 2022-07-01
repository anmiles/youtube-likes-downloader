import { download } from './downloader';
import { info, error } from './logger';
import { restrictOldFiles, getProfiles } from './profiles';
import { updateVideosData } from './videos';

export { run };
export default { run };

async function run(): Promise<void> {
	restrictOldFiles();
	const profiles = getProfiles();

	if (profiles.length === 0) {
		error('Please `npm run create` at least one profile');
	}

	for (const profile of profiles) {
		info(`Downloading ${profile}...`);
		await updateVideosData(profile);
		await download(profile);
	}

	info('Done!');
}

