import fs from 'fs';
import { getVideosString } from '../videos';
import { download } from '../downloader';
import { info } from '../logger';
import { getLikesFile } from '../paths';
import { getProfiles } from '../profiles';

import * as app from '../app';

jest.mock('fs', () => ({
	writeFileSync : jest.fn(),
}));
jest.mock('../downloader', () => ({
	download : jest.fn(),
}));

jest.mock('../logger', () => ({
	info : jest.fn(),
}));

jest.mock('../paths', () => ({
	getLikesFile : jest.fn().mockImplementation((profile) => `${profile}.txt`),
}));

jest.mock('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => [ profile1, profile2 ]),
}));

jest.mock('../videos', () => ({
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

			expect(getProfiles).toBeCalled();
		});

		it('should output info', async () => {
			await app.run();

			expect(info).toBeCalledWith(`Downloading ${profile1}...`);
			expect(info).toBeCalledWith(`Downloading ${profile2}...`);
			expect(info).toBeCalledWith('Done!');
		});

		it('should get likes file', async () => {
			await app.run();

			expect(getLikesFile).toBeCalledWith(profile1);
			expect(getLikesFile).toBeCalledWith(profile2);
		});

		it('should get videos list', async () => {
			await app.run();

			expect(getVideosString).toBeCalledWith(profile1);
			expect(getVideosString).toBeCalledWith(profile2);
		});

		it('should write likes into file', async () => {
			await app.run();

			expect(fs.writeFileSync).toBeCalledWith(likesFile1, videosString);
			expect(fs.writeFileSync).toBeCalledWith(likesFile2, videosString);
		});

		it('should download videos given likes file', async () => {
			await app.run();

			expect(download).toBeCalledWith(profile1, likesFile1);
			expect(download).toBeCalledWith(profile2, likesFile2);
		});
	});
});
