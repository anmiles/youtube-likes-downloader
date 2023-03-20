import fs from 'fs';
import { getYoutubeAPI, getItems } from '@anmiles/google-api-wrapper';
import logger from '../logger';
import paths from '../paths';

import videos from '../videos';
const original = jest.requireActual('../videos').default as typeof videos;
jest.mock<typeof videos>('../videos', () => ({
	updateVideosData : jest.fn(),
	formatVideo      : jest.fn().mockImplementation((video) => video?.snippet?.title || 'none'),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock('@anmiles/google-api-wrapper', () => ({
	getYoutubeAPI : jest.fn().mockImplementation(async () => api),
	getItems      : jest.fn().mockImplementation(async (itemsAPI: string) => {
		switch (itemsAPI) {
			case api.playlistItems: return playlistItems;
		}
	}),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	log : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile : jest.fn().mockImplementation(() => likesFile),
}));

const profile   = 'username';
const likesFile = 'likesFile';

const api = {
	playlistItems : 'playlistItems',
};

const playlistItems: Array<{ id?: string | null | undefined, snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ id : 'id1', snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ id : null, snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ id : 'id3', snippet : { title : undefined, resourceId : undefined } },
	{ id : 'id4', snippet : undefined },
];

const result = 'video1\n\nvideo2\n\nnone\n\nnone';

const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

describe('src/lib/videos', () => {
	describe('updateVideosData', () => {
		const formatVideoSpy = jest.spyOn(videos, 'formatVideo');

		it('should get youtube API with persistence', async () => {
			await original.updateVideosData(profile);

			expect(getYoutubeAPI).toBeCalledWith(profile);
		});

		it('should get data from playlistItems API and output progress', async () => {
			await original.updateVideosData(profile);

			expect(getItems).toBeCalledWith(api.playlistItems, args);
		});

		it('should format each video', async () => {
			await original.updateVideosData(profile);

			expect(formatVideoSpy).toBeCalledTimes(playlistItems.length);
			playlistItems.forEach((video, index) => expect(formatVideoSpy.mock.calls[index][0]).toEqual(video));
		});

		it('should write likes into file', async () => {
			await original.updateVideosData(profile);

			expect(fs.writeFileSync).toBeCalledWith(likesFile, result);
		});
	});

	describe('formatVideo', () => {
		it('should properly format video with existing fields', () => {
			const result = original.formatVideo(playlistItems[0]);
			expect(result).toEqual('# video1\nhttps://www.youtube.com/watch?v=video1Id');
		});

		it('should properly format video without resourceId', () => {
			const result = original.formatVideo(playlistItems[1]);
			expect(result).toEqual('# video2\nhttps://www.youtube.com/watch?v=unknown');
		});

		it('should properly format video without title and resourceId', () => {
			const result = original.formatVideo(playlistItems[2]);
			expect(result).toEqual('# Unknown\nhttps://www.youtube.com/watch?v=unknown');
		});

		it('should properly format video without snippet', () => {
			const result = original.formatVideo(playlistItems[3]);
			expect(result).toEqual('# Unknown\nhttps://www.youtube.com/watch?v=unknown');
		});
	});
});
