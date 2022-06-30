import type GoogleApis from 'googleapis';
import auth from '../auth';
import logger from '../logger';

import videos from '../videos';
const original = jest.requireActual('../videos').default as typeof videos;
jest.mock<typeof videos>('../videos', () => ({
	getVideosString : jest.fn(),
	getData         : jest.fn().mockImplementation(async () => videosList),
	formatVideo     : jest.fn().mockImplementation((video) => video?.snippet?.title || 'none'),
	sleep           : jest.fn(),
}));

jest.mock<Partial<typeof auth>>('../auth', () => ({
	getClient : jest.fn().mockImplementation(async () => ({ playlistItems })),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	log : jest.fn(),
}));

const profile = 'username';

const videosList = [
	{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ snippet : { title : undefined, resourceId : undefined } },
	{ snippet : undefined },
];

const responses = [
	[ videosList[0], videosList[1] ],
	null,
	[ videosList[2], videosList[3] ],
];

const pageTokens = [
	undefined,
	'token1',
	'token2',
];

const playlistItems = {
	list : jest.fn().mockImplementation(async ({ pageToken }: {pageToken?: string}) => {
		const index = pageTokens.indexOf(pageToken);

		return {
			data : {
				items         : responses[index],
				nextPageToken : pageTokens[index + 1],
				pageInfo      : !responses[index] ? null : {
					totalResults : videosList.length,
				},
			},
		};
	}),
} as unknown as GoogleApis.youtube_v3.Resource$Playlistitems;

const itemsArgs = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

describe('src/lib/videos', () => {
	describe('getVideosString', () => {
		const formatVideoSpy = jest.spyOn(videos, 'formatVideo');

		it('should get playlistItems API', async () => {
			await original.getVideosString(profile);

			expect(auth.getClient).toBeCalledWith(profile);
		});

		it('should get data from playlistItems API', async () => {
			await original.getVideosString(profile);

			expect(videos.getData).toBeCalledWith(playlistItems, itemsArgs);
		});

		it('should format each video', async () => {
			await original.getVideosString(profile);

			expect(formatVideoSpy).toBeCalledTimes(videosList.length);
			videosList.forEach((video, index) => expect(formatVideoSpy.mock.calls[index][0]).toEqual(video));
		});

		it('should return videos list', async () => {
			const videosList = await original.getVideosString(profile);

			expect(videosList).toEqual('video1\n\nvideo2\n\nnone\n\nnone');
		});
	});

	describe('getData', () => {
		it('should call playlistItems API for each page', async () => {
			await original.getData(playlistItems, itemsArgs);

			pageTokens.forEach((pageToken) => {
				expect(playlistItems.list).toBeCalledWith({ ...itemsArgs, pageToken });
			});
		});

		it('should output progress', async () => {
			await original.getData(playlistItems, itemsArgs);

			expect(logger.log).toBeCalledTimes(responses.length);
			expect(logger.log).toBeCalledWith('Getting video IDs (2 of 4)...');
			expect(logger.log).toBeCalledWith('Getting video IDs (2 of many)...');
			expect(logger.log).toBeCalledWith('Getting video IDs (4 of 4)...');
		});

		it('sleep after reach request', async () => {
			await original.getData(playlistItems, itemsArgs);

			expect(videos.sleep).toBeCalledTimes(responses.length);
			expect(videos.sleep).toBeCalledWith(300);
		});

		it('should return items data', async () => {
			const items = await original.getData(playlistItems, itemsArgs);

			expect(items).toEqual(videosList);
		});
	});

	describe('formatVideo', () => {
		it('should properly format video with existing fields', () => {
			const result = original.formatVideo(videosList[0]);
			expect(result).toEqual('# video1\nhttps://www.youtube.com/watch?v=video1Id');
		});

		it('should properly format video without resourceId', () => {
			const result = original.formatVideo(videosList[1]);
			expect(result).toEqual('# video2\nhttps://www.youtube.com/watch?v=unknown');
		});

		it('should properly format video without title and resourceId', () => {
			const result = original.formatVideo(videosList[2]);
			expect(result).toEqual('# Unknown\nhttps://www.youtube.com/watch?v=unknown');
		});

		it('should properly format video without snippet', () => {
			const result = original.formatVideo(videosList[3]);
			expect(result).toEqual('# Unknown\nhttps://www.youtube.com/watch?v=unknown');
		});
	});

	describe('sleep', () => {
		it('should be resolved at least after milliseconds', async () => {
			const delay  = 300;
			const before = new Date().getTime();
			await original.sleep(delay);
			const after = new Date().getTime();
			expect(after - before).toBeGreaterThanOrEqual(delay - 1);
		});
	});
});
