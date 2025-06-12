import fs from 'fs';

import { getAPI } from '@anmiles/google-api-wrapper';
import { log, warn } from '@anmiles/logger';
import '@anmiles/prototypes';
import { youtube } from 'googleapis/build/src/apis/youtube';

import { config } from './config';
import { commonErrorSchema, errorSchema } from './types/schema';
import { formatVideo } from './utils/formatVideo';
import { parseVideos } from './utils/parseVideos';
import { getIncludeLikesFile, getLikesFile } from './utils/paths';

export async function importLikes(profile: string): Promise<void> {
	const likesFile        = getLikesFile(profile);
	const includeLikesFile = getIncludeLikesFile(profile);

	const youtubeAPI          = await getAPI((auth) => youtube({ version: 'v3', auth }), profile);
	const videosList          = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId: 'LL', part: [ 'snippet' ], maxResults: 50 });
	const likesData: string[] = [];

	likesData.push(videosList.map(formatVideo).join('\n\n'));

	if (fs.existsSync(includeLikesFile)) {
		likesData.push(fs.readFileSync(includeLikesFile).toString());
	}

	const allLikesData = likesData.join('\n\n');
	fs.writeFileSync(likesFile, allLikesData);
}

export async function exportLikes(profile: string): Promise<void> {
	const youtubeAPI = await getAPI((auth) => youtube({ version: 'v3', auth }), profile, { temporary: true, scopes: config.scopes.full });
	const videosList = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId: 'LL', part: [ 'snippet' ], maxResults: 50 });

	/* istanbul ignore next */
	const existingIDs = videosList.map((video) => video.snippet?.resourceId?.videoId ?? 'unknown');
	const likesFile   = getLikesFile(profile);

	if (!fs.existsSync(likesFile)) {
		throw new Error(`Likes file ${likesFile} doesn't exist, please create it and paste each videos URL (like https://www.youtube.com/watch?v=abcabcabc) on each line`);
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
			await youtubeAPI.api.videos.rate({ id, rating });
		} catch (ex: unknown) {
			const commonError = commonErrorSchema.safeParse(ex).data;

			if (ex instanceof Error || !commonError) {
				throw ex;
			} else {
				const firstError = errorSchema.safeParse(ex).data?.errors[0];

				if (firstError) {
					switch (firstError.reason) {
						case 'videoNotFound':
						case 'notFound':
							warn(`Video ${id} not found`);
							break;

						case 'videoRatingDisabled':
						case 'videoPurchaseRequired':
							warn(`Video ${id} is not allowed to be rated`);
							break;

						case undefined:
						default:
							throw ex as unknown;
					}
				}
			}
		}
	}
}

