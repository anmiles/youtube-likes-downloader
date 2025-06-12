import { config } from '../config';

export function parseVideos(videosData: string): string[] {
	const regex   = new RegExp(`${config.urlPrefix.regexEscape()}([A-Za-z0-9_-]+)`, 'g');
	const matches = [ ...videosData.matchAll(regex) ];
	return matches.map((match) => match[1]!);
}
