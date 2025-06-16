import fs from 'fs';

import { getAPI } from '@anmiles/google-api-wrapper';
import '@anmiles/jest-extensions';
import logger from '@anmiles/logger';
import type GoogleApis from 'googleapis';
import { youtube } from 'googleapis/build/src/apis/youtube';
import mockFs from 'mock-fs';

import { exportLikes, importLikes } from '../likes';
import { getIncludeLikesFile, getLikesFile } from '../utils/paths';

jest.mock('@anmiles/google-api-wrapper');
jest.mock('@anmiles/logger');
jest.mock('googleapis/build/src/apis/youtube');

const profile          = 'username';
const likesFile        = getLikesFile(profile);
const includeLikesFile = getIncludeLikesFile(profile);

const youtubeApis = {
	playlistItems: 'playlistItems',
} as const;

function mockGetItems(selectAPI: ((api: typeof youtubeApis)=> typeof youtubeApis[keyof typeof youtubeApis])): typeof playlistItems {
	switch (selectAPI(youtubeApis)) {
		case youtubeApis.playlistItems: return playlistItems;
	}
}

const getItems = jest.mocked(jest.fn().mockImplementation(mockGetItems));

let playlistItems: Array<{ id?: string | null | undefined; snippet?: { title?: string; resourceId?: { videoId?: string } } }>;
let likesData: string;
let includeLikesData: string;

const api = {
	videos: {
		rate: jest.fn(),
	},
};

const args = { playlistId: 'LL', part: [ 'snippet' ], maxResults: 50 };
const auth = { kind: 'auth' };

// eslint-disable-next-line @typescript-eslint/require-await -- allow partial mock
const getAPIMock = jest.fn().mockImplementation(async () => ({ getItems, api }));

jest.mocked(getAPI).mockImplementation((...args: unknown[]) => getAPIMock(...args));

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
jest.mocked(youtube).mockReturnValue(youtubeApis as unknown as GoogleApis.youtube_v3.Youtube);

beforeEach(() => {
	playlistItems = [
		{ snippet: { title: 'video0', resourceId: { videoId: 'video0Id' } } },
		{ snippet: { title: 'video1', resourceId: { videoId: 'video1Id' } } },
		{ snippet: { title: 'video2', resourceId: { videoId: 'video2Id' } } },
		{ snippet: { title: 'video3', resourceId: { videoId: 'video3Id' } } },
	];

	likesData = [
		'# video0',
		'https://www.youtube.com/watch?v=video0Id',
		'',
		'# video1',
		'https://www.youtube.com/watch?v=video1Id',
		'',
		'# video2',
		'https://www.youtube.com/watch?v=video2Id',
		'',
		'# video3',
		'https://www.youtube.com/watch?v=video3Id',
	].join('\n');

	includeLikesData = [
		'# video4',
		'https://www.youtube.com/watch?v=video4Id',
		'',
		'# video5',
		'https://www.youtube.com/watch?v=video5Id',
		'',
	].join('\n');

	mockFs({
		[likesFile]       : likesData,
		[includeLikesFile]: includeLikesData,
	});
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/likes', () => {
	describe('importLikes', () => {

		it('should get youtube API', async () => {
			await importLikes(profile);

			expect(getAPI).toHaveBeenCalledWith(expect.toBeFunction([ auth ], youtubeApis), profile);
			expect(youtube).toHaveBeenCalledWith({ version: 'v3', auth });
		});

		it('should get data from playlistItems API', async () => {
			await importLikes(profile);

			expect(getItems).toHaveBeenCalledWith(expect.toBeFunction([ youtubeApis ], youtubeApis.playlistItems), args);
		});

		it('should write likes into file', async () => {
			fs.rmSync(includeLikesFile);

			await importLikes(profile);

			expect(fs.readFileSync(likesFile).toString()).toEqual(likesData);
		});

		it('should add likes from additional likes file if exists', async () => {
			await importLikes(profile);

			expect(fs.readFileSync(likesFile).toString()).toEqual(`${likesData}\n\n${includeLikesData}`);
		});
	});

	describe('exportLikes', () => {
		it('should get temporary youtube API', async () => {
			await exportLikes(profile);

			expect(getAPI).toHaveBeenCalledWith(expect.toBeFunction([ auth ], youtubeApis), profile, { temporary: true, scopes: [ 'https://www.googleapis.com/auth/youtube' ] });
			expect(youtube).toHaveBeenCalledWith({ version: 'v3', auth });
		});

		it('should get data from playlistItems API', async () => {
			await exportLikes(profile);

			expect(getItems).toHaveBeenCalledWith(expect.toBeFunction([ youtubeApis ], youtubeApis.playlistItems), args);
		});

		it('should throw if likes file does not exist', async () => {
			mockFs({});

			await expect(async () => exportLikes(profile)).rejects.toEqual(new Error(`Likes file ${likesFile} doesn't exist, please create it and paste each videos URL (like https://www.youtube.com/watch?v=abcabcabc) on each line`));
		});

		it('should process and log each video id in reverse order', async () => {
			const logSpy = jest.spyOn(logger, 'log');

			await exportLikes(profile);

			expect(logSpy.mock.calls).toEqual([
				[ 'video3Id' ],
				[ 'video2Id' ],
				[ 'video1Id' ],
				[ 'video0Id' ],
			]);
		});

		it('should not rate any video if all videos are already rated', async () => {
			await exportLikes(profile);

			expect(api.videos.rate).not.toHaveBeenCalled();
		});

		it('should only rate videos that still not rated', async () => {
			playlistItems = [
				playlistItems[0]!,
				playlistItems[2]!,
			];

			await exportLikes(profile);

			expect(api.videos.rate).toHaveBeenCalledWith({ id: 'video1Id', rating: 'like' });
			expect(api.videos.rate).toHaveBeenCalledWith({ id: 'video3Id', rating: 'like' });
		});

		describe('errors', () => {
			const minorErrors = [
				{
					reason : 'videoNotFound',
					message: 'Native videoNotFound error message',
				},
				{
					reason : 'notFound',
					message: 'Native notFound error message',
				},
				{
					reason : 'videoRatingDisabled',
					message: 'Native videoRatingDisabled error message',
				},
				{
					reason : 'videoPurchaseRequired',
					message: 'Native videoPurchaseRequired error message',
				},
			];

			const fatalErrors = [
				{
					reason : 'emailNotVerified',
					message: 'Native emailNotVerified error message',
				},
				{
					reason : 'invalidRating',
					message: 'Native invalidRating error message',
				},
				{
					reason : 'forbidden',
					message: 'Native forbidden error message',
				},
			];

			const secondError = {
				reason : 'anotherError',
				message: 'Another error',
			};

			beforeEach(() => {
				playlistItems = [];
			});

			it('should warn about errors that can be skipped', async () => {
				const warnSpy = jest.spyOn(logger, 'warn');

				minorErrors.forEach((error) => api.videos.rate.mockRejectedValueOnce({ errors: [ error, secondError ] }));

				await exportLikes(profile);

				expect(warnSpy.mock.calls).toEqual([
					[ 'Video video3Id not found' ],
					[ 'Video video2Id not found' ],
					[ 'Video video1Id is not allowed to be rated' ],
					[ 'Video video0Id is not allowed to be rated' ],
				]);
			});

			fatalErrors.forEach((error) => {
				it(`should throw once fatal error '${error.reason}' occurred and do not call rate function anymore`, async () => {
					api.videos.rate.mockResolvedValueOnce(undefined);
					api.videos.rate.mockRejectedValueOnce({ errors: [ error, secondError ] });

					await expect(async () => exportLikes(profile)).rejects.toEqual({ errors: [ error, secondError ] });

					expect(api.videos.rate).toHaveBeenCalledTimes(2);
					expect(api.videos.rate).toHaveBeenCalledWith({ id: 'video3Id', rating: 'like' });
					expect(api.videos.rate).toHaveBeenCalledWith({ id: 'video2Id', rating: 'like' });
				});
			});

			it('should re-throw unknown API errors', async () => {
				api.videos.rate.mockRejectedValueOnce({ errors: [ { reason: 'other reason' } ] });
				api.videos.rate.mockRejectedValueOnce({ errors: [ { customKey: 'value' } ] });

				await expect(async () => exportLikes(profile)).rejects.toEqual({ errors: [ { reason: 'other reason' } ] });
				await expect(async () => exportLikes(profile)).rejects.toEqual({ errors: [ { customKey: 'value' } ] });

				expect(api.videos.rate).toHaveBeenCalledTimes(2);
			});

			it('should re-throw non-API errors', async () => {
				api.videos.rate.mockRejectedValueOnce('string error');
				api.videos.rate.mockRejectedValueOnce(new Error('error'));
				api.videos.rate.mockRejectedValueOnce(null);
				api.videos.rate.mockRejectedValueOnce({ });

				await expect(async () => exportLikes(profile)).rejects.toEqual('string error');
				await expect(async () => exportLikes(profile)).rejects.toEqual(new Error('error'));
				await expect(async () => exportLikes(profile)).rejects.toEqual(null);
				await expect(async () => exportLikes(profile)).rejects.toEqual({ });

				expect(api.videos.rate).toHaveBeenCalledTimes(4);
			});

			it('should not throw if API error doesn\'t have errors in `errors` list', async () => {
				api.videos.rate.mockRejectedValueOnce({ errors: null });
				api.videos.rate.mockRejectedValueOnce({ errors: [] });

				await exportLikes(profile);

				expect(api.videos.rate).toHaveBeenCalledTimes(4);
			});
		});
	});
});
