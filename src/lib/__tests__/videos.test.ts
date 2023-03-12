import fs from 'fs';
import googleApiWrapper from '@anmiles/google-api-wrapper';
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

jest.mock<Partial<typeof googleApiWrapper>>('@anmiles/google-api-wrapper', () => ({
	getVideos : jest.fn().mockImplementation(async () => videosList),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	log : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile : jest.fn().mockImplementation(() => likesFile),
}));

const profile   = 'username';
const likesFile = 'likesFile';

const videosList = [
	{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ snippet : { title : undefined, resourceId : undefined } },
	{ snippet : undefined },
];

const videosData = 'video1\n\nvideo2\n\nnone\n\nnone';

const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

describe('src/lib/videos', () => {
	describe('updateVideosData', () => {
		const formatVideoSpy = jest.spyOn(videos, 'formatVideo');

		it('should get data from playlistItems API', async () => {
			await original.updateVideosData(profile);

			expect(googleApiWrapper.getVideos).toBeCalledWith(profile, args);
		});

		it('should format each video', async () => {
			await original.updateVideosData(profile);

			expect(formatVideoSpy).toBeCalledTimes(videosList.length);
			videosList.forEach((video, index) => expect(formatVideoSpy.mock.calls[index][0]).toEqual(video));
		});

		it('should write likes into file', async () => {
			await original.updateVideosData(profile);

			expect(fs.writeFileSync).toBeCalledWith(likesFile, videosData);
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
});
