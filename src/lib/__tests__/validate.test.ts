import '@anmiles/jest-extensions';

import { log, warn } from '@anmiles/logger';
import mockFs from 'mock-fs';

import { getOutputDir } from '../utils/paths';
import { validate } from '../validate';

jest.mock('@anmiles/logger');
jest.mock('execa');

const profile   = 'username';
const outputDir = getOutputDir(profile);
describe('src/lib/validate', () => {
	describe('validate', () => {
		beforeEach(() => {
			mockFs({
				[outputDir]: {

					/* filename matches json */
					['title 1 [channel 1].id1.mp4']        : '',
					['title 1 [channel 1].id1.jpg']        : '',
					['title 1 [channel 1].id1.description']: '',
					['title 1 [channel 1].id1.info.json']  : JSON.stringify({ id: 'id1', title: 'title 1', channel: 'channel 1' }),

					/* filename doesn't match json */
					['title 2 [channel 2].id2.mp4']        : '',
					['title 2 [channel 2].id2.webp']       : '',
					['title 2 [channel 2].id2.description']: '',
					['title 2 [channel 2].id2.info.json']  : JSON.stringify({ id: 'id2', title: 'new title 2', channel: 'channel 2' }),

					/* filename matches json but contains bad symbols */
					['title 3?*:<> [channel 3].id3.mp4']        : '',
					['title 3?*:<> [channel 3].id3.jpg']        : '',
					['title 3?*:<> [channel 3].id3.description']: '',
					['title 3?*:<> [channel 3].id3.info.json']  : JSON.stringify({ id: 'id3', title: 'title 3?*:<>', channel: 'channel 3' }),

					/* filename doesn't contain id */
					['title 4 [channel 4].mp4']        : '',
					['title 4 [channel 4].jpg']        : '',
					['title 4 [channel 4].description']: '',
					['title 4 [channel 4].info.json']  : JSON.stringify({ id: 'id4', title: 'title 4', channel: 'channel 4' }),
				},
			});
		});

		afterAll(() => {
			mockFs.restore();
		});

		it('should output files to rename', () => {
			validate(profile);

			expect(warn).toHaveBeenCalledWith('Rename');
			expect(log).toHaveBeenCalledWith('\tOld name: title 2 [channel 2].id2');
			expect(log).toHaveBeenCalledWith('\tNew name: new title 2 [channel 2].id2');

			expect(warn).toHaveBeenCalledWith('Rename');
			expect(log).toHaveBeenCalledWith('\tOld name: title 3?*:<> [channel 3].id3');
			expect(log).toHaveBeenCalledWith('\tNew name: title 3 - [channel 3].id3');

			expect(warn).toHaveBeenCalledWith('Rename');
			expect(log).toHaveBeenCalledWith('\tOld name: title 4 [channel 4]');
			expect(log).toHaveBeenCalledWith('\tNew name: title 4 [channel 4].id4');
		});

		it('should rename files', () => {
			validate(profile);

			expect(outputDir).toMatchFiles({

				/* filename matches json */
				['output/username/title 1 [channel 1].id1.mp4']        : '',
				['output/username/title 1 [channel 1].id1.jpg']        : '',
				['output/username/title 1 [channel 1].id1.description']: '',
				['output/username/title 1 [channel 1].id1.info.json']  : JSON.stringify({ id: 'id1', title: 'title 1', channel: 'channel 1' }),

				/* filename doesn't match json */
				['output/username/new title 2 [channel 2].id2.mp4']        : '',
				['output/username/new title 2 [channel 2].id2.webp']       : '',
				['output/username/new title 2 [channel 2].id2.description']: '',
				['output/username/new title 2 [channel 2].id2.info.json']  : JSON.stringify({ id: 'id2', title: 'new title 2', channel: 'channel 2' }),

				/* filename matches json but contains bad symbols */
				['output/username/title 3 - [channel 3].id3.mp4']        : '',
				['output/username/title 3 - [channel 3].id3.jpg']        : '',
				['output/username/title 3 - [channel 3].id3.description']: '',
				['output/username/title 3 - [channel 3].id3.info.json']  : JSON.stringify({ id: 'id3', title: 'title 3?*:<>', channel: 'channel 3' }),

				/* filename doesn't contain id */
				['output/username/title 4 [channel 4].id4.mp4']        : '',
				['output/username/title 4 [channel 4].id4.jpg']        : '',
				['output/username/title 4 [channel 4].id4.description']: '',
				['output/username/title 4 [channel 4].id4.info.json']  : JSON.stringify({ id: 'id4', title: 'title 4', channel: 'channel 4' }),
			});
		});

		it('should throw if no json file', () => {
			mockFs({
				[outputDir]: {

					/* filename matches json but json is not valid */
					['title 1 [channel 1].id1.mp4']        : '',
					['title 1 [channel 1].id1.jpg']        : '',
					['title 1 [channel 1].id1.description']: '',
				},
			});

			expect(() => validate(profile)).toThrow(new Error('New name cannot be defined, probably title 1 [channel 1].id1.info.json does not exist'));
		});
	});
});
