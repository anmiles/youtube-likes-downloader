import type GoogleApis from 'googleapis';
import { getClient } from './auth';
import { log } from './logger';
import { sleep } from './sleep';

import videos from './videos';

export { getVideosString };
export default { getVideosString, getData, formatVideo };

type ItemsArgs = GoogleApis.youtube_v3.Params$Resource$Playlistitems$List;
type ItemsAPI = GoogleApis.youtube_v3.Resource$Playlistitems;
type Items = GoogleApis.youtube_v3.Schema$PlaylistItemListResponse;
type Item = GoogleApis.youtube_v3.Schema$PlaylistItem;

const requestInterval = 300;

async function getVideosString(profile: string): Promise<string> {
	const { playlistItems } = await getClient(profile);
	const videosList        = await videos.getData(playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	const videosString      = videosList.map(videos.formatVideo).join('\n\n');
	return videosString;
}

async function getData(playlistItems: ItemsAPI, args: ItemsArgs): Promise<Item[]> {
	const items: Item[] = [];

	let pageToken: string | null | undefined = undefined;

	do {
		const response: GoogleApis.Common.GaxiosResponse<Items> = await playlistItems.list({ ...args, pageToken });
		response.data.items?.forEach((item) => items.push(item));
		log(`Getting video IDs (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
		pageToken = response.data.nextPageToken;

		await sleep(requestInterval);
	} while (pageToken);

	return items;
}

function formatVideo(video: Item): string {
	return [ `# ${video.snippet?.title || 'Unknown'}`, `https://www.youtube.com/watch?v=${video.snippet?.resourceId?.videoId || 'unknown'}` ].join('\n');
}
