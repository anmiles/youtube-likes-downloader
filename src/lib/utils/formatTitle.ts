import type { VideoInfo } from '../types';

export function formatTitle({ id, title, channel }: Omit<VideoInfo, 'ext'>): string {
	return `${title} [${channel}].${id}`;
}
