import fs from 'fs';
import { getVideosString } from './videos';
import { download } from './downloader';
import { info } from './logger';
import { getLikesFile } from './paths';
import { getProfiles } from './profiles';

export async function run(): Promise<void> {
	const profiles = getProfiles();

	for (const profile of profiles) {
		info(`Downloading ${profile}...`);
		const likesFile    = getLikesFile(profile);
		const videosString = await getVideosString(profile);
		fs.writeFileSync(likesFile, videosString);
		await download(profile, likesFile);
	}

	info('Done!');
}

