import fs from 'fs';
import downloader from '../downloader';
import logger from '../logger';
import paths from '../paths';
import profiles from '../profiles';
import videos from '../videos';

import app from '../app';

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock<Partial<typeof downloader>>('../downloader', () => ({
	download : jest.fn(),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	info : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile : jest.fn().mockImplementation((profile) => `${profile}.txt`),
}));

jest.mock<Partial<typeof profiles>>('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => [ profile1, profile2 ]),
}));

jest.mock<Partial<typeof videos>>('../videos', () => ({
	getVideosString : jest.fn().mockImplementation(async () => videosString),
}));

const profile1 = 'username1';
const profile2 = 'username2';

const likesFile1 = `${profile1}.txt`;
const likesFile2 = `${profile2}.txt`;

const videosString = 'video1\n\nvideo2';

describe('src/lib/app', () => {
	describe('run', () => {
		it('should get profiles', async () => {
			await app.run();

			expect(profiles.getProfiles).toBeCalled();
		});

		it('should output info', async () => {
			await app.run();

			expect(logger.info).toBeCalledWith(`Downloading ${profile1}...`);
			expect(logger.info).toBeCalledWith(`Downloading ${profile2}...`);
			expect(logger.info).toBeCalledWith('Done!');
		});

		it('should get likes file', async () => {
			await app.run();

			expect(paths.getLikesFile).toBeCalledWith(profile1);
			expect(paths.getLikesFile).toBeCalledWith(profile2);
		});

		it('should get videos list', async () => {
			await app.run();

			expect(videos.getVideosString).toBeCalledWith(profile1);
			expect(videos.getVideosString).toBeCalledWith(profile2);
		});

		it('should write likes into file', async () => {
			await app.run();

			expect(fs.writeFileSync).toBeCalledWith(likesFile1, videosString);
			expect(fs.writeFileSync).toBeCalledWith(likesFile2, videosString);
		});

		it('should download videos given likes file', async () => {
			await app.run();

			expect(downloader.download).toBeCalledWith(profile1, likesFile1);
			expect(downloader.download).toBeCalledWith(profile2, likesFile2);
		});
	});
});
