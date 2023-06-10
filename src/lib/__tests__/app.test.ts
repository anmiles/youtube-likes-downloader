import googleApiWrapper from '@anmiles/google-api-wrapper';
import logger from '@anmiles/logger';
import downloader from '../downloader';
import videos from '../videos';

import app from '../app';

jest.mock<Partial<typeof downloader>>('../downloader', () => ({
	download : jest.fn(),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	info : jest.fn(),
}));

jest.mock<Partial<typeof googleApiWrapper>>('@anmiles/google-api-wrapper', () => ({
	getProfiles : jest.fn().mockImplementation(() => existingProfiles),
}));

jest.mock<Partial<typeof videos>>('../videos', () => ({
	importLikes : jest.fn().mockImplementation(async () => videosData),
	exportLikes : jest.fn().mockImplementation(),
}));

const profile1   = 'username1';
const profile2   = 'username2';
const videosData = 'video1\n\nvideo2';

let existingProfiles: string[];

beforeEach(() => {
	existingProfiles = [ profile1, profile2 ];
});

describe('src/lib/app', () => {
	describe('run', () => {
		it('should get profiles', async () => {
			await app.run();

			expect(googleApiWrapper.getProfiles).toHaveBeenCalled();
		});

		it('should output error if no profiles', async () => {
			existingProfiles = [];

			const func = () => app.run();

			await expect(func).rejects.toEqual('Please `npm run create` at least one profile');
		});

		it('should output info', async () => {
			await app.run();

			expect(logger.info).toHaveBeenCalledWith(`Importing likes from ${profile1}...`);
			expect(logger.info).toHaveBeenCalledWith(`Downloading videos from ${profile1}...`);

			expect(logger.info).toHaveBeenCalledWith(`Importing likes from ${profile2}...`);
			expect(logger.info).toHaveBeenCalledWith(`Downloading videos from ${profile2}...`);

			expect(logger.info).toHaveBeenCalledWith('Done!');
		});

		it('should update videos data for all profiles', async () => {
			await app.run();

			expect(videos.importLikes).toHaveBeenCalledWith(profile1);
			expect(videos.importLikes).toHaveBeenCalledWith(profile2);
		});

		it('should download videos for all profiles', async () => {
			await app.run();

			expect(downloader.download).toHaveBeenCalledWith(profile1);
			expect(downloader.download).toHaveBeenCalledWith(profile2);
		});

		it('should update videos data only for specified profile', async () => {
			await app.run(profile1);

			expect(videos.importLikes).toHaveBeenCalledWith(profile1);
			expect(videos.importLikes).not.toHaveBeenCalledWith(profile2);
		});

		it('should download videos only for specified profile', async () => {
			await app.run(profile1);

			expect(downloader.download).toHaveBeenCalledWith(profile1);
			expect(downloader.download).not.toHaveBeenCalledWith(profile2);
		});
	});

	describe('update', () => {
		it('should get profiles', async () => {
			await app.update();

			expect(googleApiWrapper.getProfiles).toHaveBeenCalled();
		});

		it('should output error if no profiles', async () => {
			existingProfiles = [];

			const func = () => app.update();

			await expect(func).rejects.toEqual('Please `npm run create` at least one profile');
		});

		it('should output info', async () => {
			await app.update();

			expect(logger.info).toHaveBeenCalledWith(`Exporting likes into ${profile1}...`);
			expect(logger.info).toHaveBeenCalledWith(`Exporting likes into ${profile2}...`);
			expect(logger.info).toHaveBeenCalledWith('Done!');
		});

		it('should export likes for all profiles', async () => {
			await app.update();

			expect(videos.exportLikes).toHaveBeenCalledWith(profile1);
			expect(videos.exportLikes).toHaveBeenCalledWith(profile2);
		});

		it('should export likes only for specified profile', async () => {
			await app.update(profile1);

			expect(videos.exportLikes).toHaveBeenCalledWith(profile1);
			expect(videos.exportLikes).not.toHaveBeenCalledWith(profile2);
		});
	});
});
