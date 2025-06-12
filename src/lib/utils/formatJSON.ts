/* eslint-disable camelcase */
import type { VideoInfo, VideoJSON } from '../types';

export function formatJSON(
	{ id, title, channel, ext, resolution, duration }: VideoInfo & { resolution: [number, number]; duration: string },
): VideoJSON {
	return {
		id,
		title,
		channel,
		ext,
		width          : resolution[0],
		height         : resolution[1],
		resolution     : resolution.join('x'),
		duration_string: duration,
	};
}
