import fs from 'fs';
import type GoogleApis from 'googleapis';
import logger from '@anmiles/logger';
import { youtube } from 'googleapis/build/src/apis/youtube';
import type paths from '../paths';
import '@anmiles/jest-extensions';

import videos from '../videos';

const original = jest.requireActual<{ default : typeof videos }>('../videos').default;
jest.mock<typeof videos>('../videos', () => ({
	exportLikes : jest.fn(),
	importLikes : jest.fn(),
	formatVideo : jest.fn().mockImplementation((video: GoogleApis.youtube_v3.Schema$PlaylistItem) => original.formatVideo(video)),
	parseVideos : jest.fn().mockImplementation((videosData: string) => original.parseVideos(videosData)),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	existsSync   : jest.fn().mockImplementation((filename: string) => exists[filename]),
	readFileSync : jest.fn().mockImplementation((filename: string) => {
		switch (filename) {
			case likesFile: return likesData;
			case includeLikesFile: return includeLikesData;
			default: return '';
		}
	}),
	writeFileSync : jest.fn(),
}));

jest.mock<{ youtube : typeof youtube }>('googleapis/build/src/apis/youtube', () => ({
	youtube : jest.fn().mockImplementation(() => apis),
}));

jest.mock('@anmiles/google-api-wrapper', () => ({
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- simplified mock
	getAPI : jest.fn().mockImplementation((...args: unknown[]) => getAPI(...args)),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log  : jest.fn(),
	warn : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile        : jest.fn().mockImplementation(() => likesFile),
	getIncludeLikesFile : jest.fn().mockImplementation(() => includeLikesFile),
}));

const profile          = 'username';
const likesFile        = 'likesFile';
const includeLikesFile = 'includeLikesFile';

const apis = {
	playlistItems : 'playlistItems',
} as const;

let playlistItems: Array<{ id? : string | null | undefined; snippet? : { title? : string; resourceId? : { videoId? : string } } }>;
let likesData: string;
let includeLikesData: string;
let exists: Record<string, boolean> = {};

const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

function mockGetItems(selectAPI: ((api: typeof apis) => typeof apis[keyof typeof apis])): typeof playlistItems {
	switch (selectAPI(apis)) {
		case apis.playlistItems: return playlistItems;
	}
}

const getItems = jest.fn().mockImplementation(mockGetItems) as jest.Mock<unknown, Parameters<typeof mockGetItems>>;

const rate = jest.fn();

// eslint-disable-next-line @typescript-eslint/require-await -- allow partial mock
const getAPI = jest.fn().mockImplementation(async () => ({ getItems,
	api : {
		videos : {
			rate,
		},
	},
}));

const auth = { kind : 'auth' };

beforeEach(() => {
	playlistItems = [
		{ snippet : { title : 'video0', resourceId : { videoId : 'video0Id' } } },
		{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
		{ snippet : { title : 'video2', resourceId : { videoId : 'video2Id' } } },
		{ snippet : { title : 'video3', resourceId : { videoId : 'video3Id' } } },
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

	exists = {
		[likesFile]        : true,
		[includeLikesFile] : false,
	};
});

describe('src/lib/videos', () => {
	describe('importLikes', () => {
		const formatVideoSpy = jest.spyOn(videos, 'formatVideo');

		it('should get youtube API', async () => {
			await original.importLikes(profile);

			expect(getAPI).toHaveBeenCalledWith(expect.toBeFunction([ auth ], apis), profile);
			expect(youtube).toHaveBeenCalledWith({ version : 'v3', auth });
		});

		it('should get data from playlistItems API', async () => {
			await original.importLikes(profile);

			expect(getItems).toHaveBeenCalledWith(expect.toBeFunction([ apis ], apis.playlistItems), args);
		});

		it('should format each video', async () => {
			await original.importLikes(profile);

			expect(formatVideoSpy).toHaveBeenCalledTimes(playlistItems.length);
			playlistItems.forEach((video, index) => {
				expect(formatVideoSpy.mock.calls[index]?.[0]).toEqual(video);
			});
		});

		it('should write likes into file', async () => {
			await original.importLikes(profile);

			expect(fs.writeFileSync).toHaveBeenCalledWith(likesFile, likesData);
		});

		it('should add likes from additional likes file if exists', async () => {
			exists[includeLikesFile] = true;

			await original.importLikes(profile);

			expect(fs.writeFileSync).toHaveBeenCalledWith(likesFile, `${likesData}\n\n${includeLikesData}`);
		});
	});

	describe('exportLikes', () => {
		it('should get temporary youtube API', async () => {
			await original.exportLikes(profile);

			expect(getAPI).toHaveBeenCalledWith(expect.toBeFunction([ auth ], apis), profile, { temporary : true, scopes : [ 'https://www.googleapis.com/auth/youtube' ] });
			expect(youtube).toHaveBeenCalledWith({ version : 'v3', auth });
		});

		it('should get data from playlistItems API', async () => {
			await original.exportLikes(profile);

			expect(getItems).toHaveBeenCalledWith(expect.toBeFunction([ apis ], apis.playlistItems), args);
		});

		it('should read likes file', async () => {
			await original.exportLikes(profile);

			expect(fs.readFileSync).toHaveBeenCalledWith(likesFile);
		});

		it('should throw if likes file does not exist', async () => {
			exists[likesFile] = false;

			await expect(async () => original.exportLikes(profile)).rejects.toEqual(new Error(`Likes file ${likesFile} doesn't exist, please create it and paste each videos URL (like https://www.youtube.com/watch?v=abcabcabc) on each line`));
		});

		it('should process and log each video id in reverse order', async () => {
			const logSpy = jest.spyOn(logger, 'log');

			await original.exportLikes(profile);

			expect(logSpy.mock.calls).toEqual([
				[ 'video3Id' ],
				[ 'video2Id' ],
				[ 'video1Id' ],
				[ 'video0Id' ],
			]);
		});

		it('should not rate any video if all videos are already rated', async () => {
			await original.exportLikes(profile);

			expect(rate).not.toHaveBeenCalled();
		});

		it('should only rate videos that still not rated', async () => {
			playlistItems = [
				playlistItems[0]!,
				playlistItems[2]!,
			];

			await original.exportLikes(profile);

			expect(rate).toHaveBeenCalledWith({ id : 'video1Id', rating : 'like' });
			expect(rate).toHaveBeenCalledWith({ id : 'video3Id', rating : 'like' });
		});

		describe('errors', () => {
			const minorErrors = [
				{
					reason  : 'videoNotFound',
					message : 'Native videoNotFound error message',
				},
				{
					reason  : 'notFound',
					message : 'Native notFound error message',
				},
				{
					reason  : 'videoRatingDisabled',
					message : 'Native videoRatingDisabled error message',
				},
				{
					reason  : 'videoPurchaseRequired',
					message : 'Native videoPurchaseRequired error message',
				},
			];

			const fatalErrors = [
				{
					reason  : 'emailNotVerified',
					message : 'Native emailNotVerified error message',
				},
				{
					reason  : 'invalidRating',
					message : 'Native invalidRating error message',
				},
				{
					reason  : 'forbidden',
					message : 'Native forbidden error message',
				},
			];

			const secondError = {
				reason  : 'anotherError',
				message : 'Another error',
			};

			beforeEach(() => {
				playlistItems = [];
			});

			it('should warn about errors that can be skipped', async () => {
				const warnSpy = jest.spyOn(logger, 'warn');

				minorErrors.forEach((error) => rate.mockRejectedValueOnce({ errors : [ error, secondError ] }));

				await original.exportLikes(profile);

				expect(warnSpy.mock.calls).toEqual([
					[ 'Video video3Id not found' ],
					[ 'Video video2Id not found' ],
					[ 'Video video1Id is not allowed to be rated' ],
					[ 'Video video0Id is not allowed to be rated' ],
				]);
			});

			fatalErrors.forEach((error) => {
				it(`should throw once fatal error '${error.reason}' occurred and do not call rate function anymore`, async () => {
					rate.mockResolvedValueOnce(undefined);
					rate.mockRejectedValueOnce({ errors : [ error, secondError ] });

					await expect(async () => original.exportLikes(profile)).rejects.toEqual({ errors : [ error, secondError ] });

					expect(rate).toHaveBeenCalledTimes(2);
					expect(rate).toHaveBeenCalledWith({ id : 'video3Id', rating : 'like' });
					expect(rate).toHaveBeenCalledWith({ id : 'video2Id', rating : 'like' });
				});
			});

			it('should re-throw unknown API errors', async () => {
				rate.mockRejectedValueOnce({ errors : [ { reason : 'other reason' } ] });
				rate.mockRejectedValueOnce({ errors : [ { customKey : 'value' } ] });

				await expect(async () => original.exportLikes(profile)).rejects.toEqual({ errors : [ { reason : 'other reason' } ] });
				await expect(async () => original.exportLikes(profile)).rejects.toEqual({ errors : [ { customKey : 'value' } ] });

				expect(rate).toHaveBeenCalledTimes(2);
			});

			it('should re-throw non-API errors', async () => {
				rate.mockRejectedValueOnce('string error');
				rate.mockRejectedValueOnce(new Error('error'));
				rate.mockRejectedValueOnce(null);
				rate.mockRejectedValueOnce({ });

				await expect(async () => original.exportLikes(profile)).rejects.toEqual('string error');
				await expect(async () => original.exportLikes(profile)).rejects.toEqual(new Error('error'));
				await expect(async () => original.exportLikes(profile)).rejects.toEqual(null);
				await expect(async () => original.exportLikes(profile)).rejects.toEqual({ });

				expect(rate).toHaveBeenCalledTimes(4);
			});

			it('should not throw if API error doesn\'t have errors in `errors` list', async () => {
				rate.mockRejectedValueOnce({ errors : null });
				rate.mockRejectedValueOnce({ errors : [] });

				await original.exportLikes(profile);

				expect(rate).toHaveBeenCalledTimes(4);
			});
		});
	});

	describe('formatVideo', () => {
		it('should properly format video with existing fields', () => {
			playlistItems.forEach((video, index) => {
				const formatted = original.formatVideo(video);
				expect(formatted).toEqual(`# video${index}\nhttps://www.youtube.com/watch?v=video${index}Id`);
			});
		});
	});

	describe('parseVideos', () => {
		it('should extract videos ids from text', () => {
			expect(original.parseVideos(likesData)).toEqual([
				'video0Id',
				'video1Id',
				'video2Id',
				'video3Id',
			]);
		});
	});
});
