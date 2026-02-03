import type { VideoInfo } from '../types';

export function formatTitle({ id, title, channel }: Pick<VideoInfo, 'id' | 'title' | 'channel'>): string {
	return `${title} [${channel}].${id}`;
}
