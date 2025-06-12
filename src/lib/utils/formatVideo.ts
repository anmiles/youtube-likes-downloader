import type GoogleApis from 'googleapis';

import { config } from '../config';

export function formatVideo(video: GoogleApis.youtube_v3.Schema$PlaylistItem): string {
	/* istanbul ignore next */
	return [ `# ${video.snippet?.title ?? 'Unknown'}`, `${config.urlPrefix}${video.snippet?.resourceId?.videoId ?? 'unknown'}` ].join('\n');
}
