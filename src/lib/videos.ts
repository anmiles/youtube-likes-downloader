import fs from 'fs';

import { getAPI } from '@anmiles/google-api-wrapper';
import { log, warn } from '@anmiles/logger';
import '@anmiles/prototypes';
import type GoogleApis from 'googleapis';
import { youtube } from 'googleapis/build/src/apis/youtube';
import { z } from 'zod';

import { getIncludeLikesFile, getLikesFile } from './utils/paths';

const urlPrefix = 'https://www.youtube.com/watch?v=';

const fullScopes = [
	'https://www.googleapis.com/auth/youtube',
];

const commonErrorSchema = z.object({
	errors: z.null().or(z.array(z.unknown())),
});

const errorSchema = z.object({
	errors: z.array(
		z.object({
			reason : z.string().optional(),
			message: z.string().optional(),
		}),
	),
});

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
	const youtubeAPI = await getAPI((auth) => youtube({ version: 'v3', auth }), profile, { temporary: true, scopes: fullScopes });
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
			await youtubeAPI.api!.videos.rate({ id, rating });
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

function formatVideo(video: GoogleApis.youtube_v3.Schema$PlaylistItem): string {
	/* istanbul ignore next */
	return [ `# ${video.snippet?.title ?? 'Unknown'}`, `${urlPrefix}${video.snippet?.resourceId?.videoId ?? 'unknown'}` ].join('\n');
}

function parseVideos(videosData: string): string[] {
	const regex   = new RegExp(`${urlPrefix.regexEscape()}([A-Za-z0-9_-]+)`, 'g');
	const matches = [ ...videosData.matchAll(regex) ];
	return matches.map((match) => match[1]!);
}
