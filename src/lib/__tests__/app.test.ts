import { filterProfiles } from '@anmiles/google-api-wrapper';
import { info } from '@anmiles/logger';

import { addVideo } from '../addVideo';
import { add, check, run, update } from '../app';
import { download } from '../download';
import { exportLikes, importLikes } from '../likes';
import { validate } from '../validate';

jest.mock('@anmiles/google-api-wrapper');
jest.mock('@anmiles/logger');
jest.mock('../addVideo');
jest.mock('../download');
jest.mock('../likes');
jest.mock('../validate');

const profile1 = 'username1';
const profile2 = 'username2';

jest.mocked(filterProfiles).mockReturnValue([ profile1, profile2 ]);

describe('src/lib/app', () => {
	describe('run', () => {
		it('should filter profiles', async () => {
			await run(profile1);

			expect(filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should output info', async () => {
			await run();

			expect(info).toHaveBeenCalledWith(`Importing likes from ${profile1}...`);
			expect(info).toHaveBeenCalledWith(`Downloading videos from ${profile1}...`);

			expect(info).toHaveBeenCalledWith(`Importing likes from ${profile2}...`);
			expect(info).toHaveBeenCalledWith(`Downloading videos from ${profile2}...`);

			expect(info).toHaveBeenCalledWith('Done!');
		});

		it('should update videos data for all filtered profiles', async () => {
			await run();

			expect(importLikes).toHaveBeenCalledWith(profile1);
			expect(importLikes).toHaveBeenCalledWith(profile2);
		});

		it('should download videos for all filtered profiles', async () => {
			await run();

			expect(download).toHaveBeenCalledWith(profile1);
			expect(download).toHaveBeenCalledWith(profile2);
		});
	});
	describe('check', () => {
		it('should filter profiles', () => {
			check(profile1);

			expect(filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should output info', () => {
			check();

			expect(info).toHaveBeenCalledWith(`Validating filenames (${profile1})...`);
			expect(info).toHaveBeenCalledWith(`Validating filenames (${profile2})...`);
			expect(info).toHaveBeenCalledWith('Done!');
		});

		it('should validate filenames for all filtered profiles', () => {
			check();

			expect(validate).toHaveBeenCalledWith(profile1);
			expect(validate).toHaveBeenCalledWith(profile2);
		});
	});

	describe('update', () => {
		it('should filter profiles', async () => {
			await update(profile1);

			expect(filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should output info', async () => {
			await update();

			expect(info).toHaveBeenCalledWith(`Exporting likes into ${profile1}...`);
			expect(info).toHaveBeenCalledWith(`Exporting likes into ${profile2}...`);
			expect(info).toHaveBeenCalledWith('Done!');
		});

		it('should export likes for all filtered profiles', async () => {
			await update();

			expect(exportLikes).toHaveBeenCalledWith(profile1);
			expect(exportLikes).toHaveBeenCalledWith(profile2);
		});
	});

	describe('addVideo', () => {
		it('should filter profiles', async () => {
			await add(profile1);

			expect(filterProfiles).toHaveBeenCalledWith(profile1);
		});

		it('should throw if no profiles specified', async () => {
			await expect(add('')).rejects.toThrow(new Error('Video should be added to the particular profile; specify it as `npm add <profile>`'));
		});

		it('should output info', async () => {
			await add(profile1);

			expect(info).toHaveBeenCalledWith(`Adding video for ${profile1}...`);
			expect(info).toHaveBeenCalledWith('Done!');
		});

		it('should add video for selected profile', async () => {
			await add(profile1);

			expect(addVideo).toHaveBeenCalledWith(profile1);
		});
	});
});
