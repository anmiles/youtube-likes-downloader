import fs from 'fs';
import type GoogleApis from 'googleapis';
import { youtube } from '@anmiles/google-api-wrapper';
import { getLikesFile } from './paths';

import videos from './videos';

export { updateVideosData };
export default { updateVideosData, formatVideo };

async function updateVideosData(profile: string): Promise<void> {
	const videosList = await youtube.getPlaylistItems(profile, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 }, { showProgress : true });
	const videosData = videosList.map(videos.formatVideo).join('\n\n');
	const likesFile  = getLikesFile(profile);
	fs.writeFileSync(likesFile, videosData);
}

function formatVideo(video: GoogleApis.youtube_v3.Schema$PlaylistItem): string {
	return [ `# ${video.snippet?.title || 'Unknown'}`, `https://www.youtube.com/watch?v=${video.snippet?.resourceId?.videoId || 'unknown'}` ].join('\n');
}
