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
	updateVideosData : jest.fn().mockImplementation(async () => videosData),
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

			expect(logger.info).toHaveBeenCalledWith(`Downloading ${profile1}...`);
			expect(logger.info).toHaveBeenCalledWith(`Downloading ${profile2}...`);
			expect(logger.info).toHaveBeenCalledWith('Done!');
		});

		it('should update videos data for all profiles', async () => {
			await app.run();

			expect(videos.updateVideosData).toHaveBeenCalledWith(profile1);
			expect(videos.updateVideosData).toHaveBeenCalledWith(profile2);
		});

		it('should download videos for all profiles', async () => {
			await app.run();

			expect(downloader.download).toHaveBeenCalledWith(profile1);
			expect(downloader.download).toHaveBeenCalledWith(profile2);
		});

		it('should update videos data only for specified profile', async () => {
			await app.run(profile1);

			expect(videos.updateVideosData).toHaveBeenCalledWith(profile1);
			expect(videos.updateVideosData).not.toHaveBeenCalledWith(profile2);
		});

		it('should download videos only for specified profile', async () => {
			await app.run(profile1);

			expect(downloader.download).toHaveBeenCalledWith(profile1);
			expect(downloader.download).not.toHaveBeenCalledWith(profile2);
		});
	});
});
