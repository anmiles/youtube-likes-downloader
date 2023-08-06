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
	filterProfiles : jest.fn().mockImplementation(() => [ profile1, profile2 ]),
}));

jest.mock<Partial<typeof videos>>('../videos', () => ({
	importLikes : jest.fn().mockImplementation(async () => videosData),
	exportLikes : jest.fn().mockImplementation(),
}));

const profile1   = 'username1';
const profile2   = 'username2';
const videosData = 'video1\n\nvideo2';

describe('src/lib/app', () => {
	describe('run', () => {
		it('should filter profiles', async () => {
			await app.run(profile1);

			expect(googleApiWrapper.filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should output info', async () => {
			await app.run();

			expect(logger.info).toHaveBeenCalledWith(`Importing likes from ${profile1}...`);
			expect(logger.info).toHaveBeenCalledWith(`Downloading videos from ${profile1}...`);

			expect(logger.info).toHaveBeenCalledWith(`Importing likes from ${profile2}...`);
			expect(logger.info).toHaveBeenCalledWith(`Downloading videos from ${profile2}...`);

			expect(logger.info).toHaveBeenCalledWith('Done!');
		});

		it('should update videos data for all filtered profiles', async () => {
			await app.run();

			expect(videos.importLikes).toHaveBeenCalledWith(profile1);
			expect(videos.importLikes).toHaveBeenCalledWith(profile2);
		});

		it('should download videos for all filtered profiles', async () => {
			await app.run();

			expect(downloader.download).toHaveBeenCalledWith(profile1);
			expect(downloader.download).toHaveBeenCalledWith(profile2);
		});
	});

	describe('update', () => {
		it('should filter profiles', async () => {
			await app.update(profile1);

			expect(googleApiWrapper.filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should output info', async () => {
			await app.update();

			expect(logger.info).toHaveBeenCalledWith(`Exporting likes into ${profile1}...`);
			expect(logger.info).toHaveBeenCalledWith(`Exporting likes into ${profile2}...`);
			expect(logger.info).toHaveBeenCalledWith('Done!');
		});

		it('should export likes for all filtered profiles', async () => {
			await app.update();

			expect(videos.exportLikes).toHaveBeenCalledWith(profile1);
			expect(videos.exportLikes).toHaveBeenCalledWith(profile2);
		});
	});
});
