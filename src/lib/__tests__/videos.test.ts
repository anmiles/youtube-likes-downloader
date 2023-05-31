import fs from 'fs';
import paths from '../paths';
import '../../types/jest';

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
	getAPI : jest.fn().mockImplementation((...args) => getAPI(...args)),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile : jest.fn().mockImplementation(() => likesFile),
}));

const profile   = 'username';
const likesFile = 'likesFile';

const apis = {
	playlistItems : 'playlistItems',
} as const;

const playlistItems: Array<{ id?: string | null | undefined, snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ id : 'id1', snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ id : null, snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ id : 'id3', snippet : { title : undefined, resourceId : undefined } },
	{ id : 'id4', snippet : undefined },
];

const result = 'video1\n\nvideo2\n\nnone\n\nnone';

const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

const getItems = jest.fn().mockImplementation(async (selectAPI: (api: typeof apis) => typeof apis[keyof typeof apis]) => {
	switch (selectAPI(apis)) {
		case apis.playlistItems: return playlistItems;
	}
});

const getAPI = jest.fn().mockImplementation(async () => ({
	getItems,
}));

describe('src/lib/videos', () => {
	describe('updateVideosData', () => {
		const formatVideoSpy = jest.spyOn(videos, 'formatVideo');

		it('should get youtube API', async () => {
			await original.updateVideosData(profile);

			expect(getAPI).toHaveBeenCalledWith('youtube', profile);
		});

		it('should get data from playlistItems API', async () => {
			await original.updateVideosData(profile);

			expect(getItems).toHaveBeenCalledWith(expect.function([ apis ], apis.playlistItems), args);
		});

		it('should format each video', async () => {
			await original.updateVideosData(profile);

			expect(formatVideoSpy).toHaveBeenCalledTimes(playlistItems.length);
			playlistItems.forEach((video, index) => expect(formatVideoSpy.mock.calls[index][0]).toEqual(video));
		});

		it('should write likes into file', async () => {
			await original.updateVideosData(profile);

			expect(fs.writeFileSync).toHaveBeenCalledWith(likesFile, result);
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
