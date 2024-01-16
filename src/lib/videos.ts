import fs from 'fs';
import type GoogleApis from 'googleapis';
import { youtube } from 'googleapis/build/src/apis/youtube';
import { getAPI } from '@anmiles/google-api-wrapper';
import { log, warn } from '@anmiles/logger';
import { getLikesFile, getIncludeLikesFile } from './paths';
import '@anmiles/prototypes';

import videos from './videos';

export { importLikes, exportLikes };
export default { importLikes, exportLikes, formatVideo, parseVideos };

const urlPrefix = 'https://www.youtube.com/watch?v=';

const fullScopes = [
	'https://www.googleapis.com/auth/youtube',
];

async function importLikes(profile: string): Promise<void> {
	const likesFile        = getLikesFile(profile);
	const includeLikesFile = getIncludeLikesFile(profile);

	const youtubeAPI          = await getAPI((auth) => youtube({ version : 'v3', auth }), profile);
	const videosList          = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	const likesData: string[] = [];

	likesData.push(videosList.map(videos.formatVideo).join('\n\n'));

	if (fs.existsSync(includeLikesFile)) {
		likesData.push(fs.readFileSync(includeLikesFile).toString());
	}

	const allLikesData = likesData.join('\n\n');
	fs.writeFileSync(likesFile, allLikesData);
}

async function exportLikes(profile: string): Promise<void> {
	const youtubeAPI = await getAPI((auth) => youtube({ version : 'v3', auth }), profile, { temporary : true, scopes : fullScopes });
	const videosList = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });

	/* istanbul ignore next */
	const existingIDs = videosList.map((video) => video.snippet?.resourceId?.videoId || 'unknown');
	const likesFile   = getLikesFile(profile);

	if (!fs.existsSync(likesFile)) {
		throw `Likes file ${likesFile} doesn't exist, please create it and paste each videos URL (like https://www.youtube.com/watch?v=abcabcabc) on each line`;
	}

	const likesData = fs.readFileSync(likesFile).toString();
	const ids       = parseVideos(likesData);
	const rating    = 'like';

	for (const id of ids.reverse()) {
		log(id);

		if (existingIDs.includes(id)) {
			continue;
		}

		try {
			await youtubeAPI.api!.videos.rate({ id, rating });
		} catch (ex: unknown) {
			if (typeof ex === 'object' && ex && 'errors' in ex) {
				if (Array.isArray(ex['errors']) && ex.errors.length > 0) {
					switch (ex.errors[0].reason) {
						case 'videoNotFound':
						case 'notFound':
							warn(`Video ${id} not found`);
							break;

						case 'videoRatingDisabled':
						case 'videoPurchaseRequired':
							warn(`Video ${id} is not allowed to be rated`);
							break;

						default:
							throw ex;
					}
				}
			} else {
				throw ex;
			}
		}
	}
}

function formatVideo(video: GoogleApis.youtube_v3.Schema$PlaylistItem): string {
	/* istanbul ignore next */
	return [ `# ${video.snippet?.title || 'Unknown'}`, `${urlPrefix}${video.snippet?.resourceId?.videoId || 'unknown'}` ].join('\n');
}

function parseVideos(videosData: string): string[] {
	const regex   = new RegExp(`${urlPrefix.regexEscape()}([A-Za-z0-9_-]+)`, 'g');
	const matches = [ ...videosData.matchAll(regex) ];
	return matches.map((match) => match[1]!);
}
