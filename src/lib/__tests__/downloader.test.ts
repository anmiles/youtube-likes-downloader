import fs from 'fs';
import type path from 'path';
import execa from 'execa';
import logger from '@anmiles/logger';
import paths from '../paths';

import downloader from '../downloader';

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
	existsSync    : jest.fn(),
	renameSync    : jest.fn(),
}));

const originalPath = jest.requireActual<typeof path>('path');
jest.mock<Partial<typeof path>>('path', () => ({
	resolve : jest.fn().mockImplementation((relativePath) => `/rootPath/${relativePath}`),
	join    : jest.fn().mockImplementation((...paths: string[]) => paths.join('/')),
	parse   : jest.fn().mockImplementation((filename: string) => originalPath.parse(filename)),
	sep     : '/',
}));

jest.mock('execa', () => jest.fn().mockImplementation(() => ({
	stdout : !hasStdout
		? null
		: {
			pipe,
		},
})));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log  : jest.fn(),
	warn : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getLikesFile       : jest.fn().mockImplementation((profile) => `${profile}.txt`),
	getOutputDir       : jest.fn().mockImplementation((profile) => `output/${profile}`),
	getDownloadArchive : jest.fn().mockImplementation((profile) => `${profile}.ytdlp`),
}));

const profile = 'username';

const pipe = jest.fn();
let hasStdout: boolean;

describe('src/lib/downloader', () => {
	describe('download', () => {
		beforeEach(() => {
			hasStdout = true;
		});

		it('should get likes file', async () => {
			await downloader.download(profile);

			expect(paths.getLikesFile).toHaveBeenCalledWith(profile);
		});

		it('should get outputDir', async () => {
			await downloader.download(profile);

			expect(paths.getOutputDir).toHaveBeenCalledWith(profile);
		});

		it('should get downloadArchive', async () => {
			await downloader.download(profile);

			expect(paths.getDownloadArchive).toHaveBeenCalledWith(profile);
		});

		it('should call yt-dlp', async () => {
			await downloader.download(profile);

			expect(execa).toHaveBeenCalledWith('yt-dlp', [
				'--batch-file', '/rootPath/username.txt',
				'--download-archive', '/rootPath/username.ytdlp',
				'--output', '%(title)s [%(channel)s].%(id)s',
				'--format-sort', 'vcodec:h264,acodec:mp3',
				'--merge-output-format', 'mp4',
				'--sponsorblock-remove', 'sponsor',
				'--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
				'--geo-bypass',
				'--no-playlist',
				'--no-overwrites',
				'--no-part',
				'--continue',
				'--abort-on-error',
				'--verbose',
				'--write-thumbnail',
				'--write-description',
				'--write-info-json',
			], { cwd : 'output/username' });
		});

		it('should pipe yt-dlp stdout to process stdout if exists', async () => {
			hasStdout = true;

			await downloader.download(profile);

			expect(pipe).toHaveBeenCalledWith(process.stdout);
		});

		it('should not pipe yt-dlp stdout if not exists', async () => {
			hasStdout = false;

			await downloader.download(profile);

			expect(pipe).not.toHaveBeenCalledWith();
		});
	});

	describe('validate', () => {
		const badSymbols = '?*:<>';

		const files = [

			/* filename matches json */
			{ name : 'title 1 [channel 1].id1.mp4' },
			{ name : 'title 1 [channel 1].id1.jpg' },
			{ name : 'title 1 [channel 1].id1.description' },
			{
				name : 'title 1 [channel 1].id1.info.json',
				json : { id : 'id1', title : 'title 1', channel : 'channel 1' },
			},

			/* filename doesn't match json */
			{ name : 'title 2 [channel 2].id2.mp4' },
			{ name : 'title 2 [channel 2].id2.webp' },
			{ name : 'title 2 [channel 2].id2.description' },
			{
				name : 'title 2 [channel 2].id2.info.json',
				json : { id : 'id2', title : 'new title 2', channel : 'channel 2' },
			},

			/* filename matches json but contains bad symbols */
			{ name : `title 3${badSymbols} [channel 3].id3.mp4` },
			{ name : `title 3${badSymbols} [channel 3].id3.jpg` },
			{ name : `title 3${badSymbols} [channel 3].id3.description` },
			{
				name : `title 3${badSymbols} [channel 3].id3.info.json`,
				json : { id : 'id3', title : `title 3${badSymbols}`, channel : 'channel 3' },
			},

			/* filename doesn't contain id */
			{ name : 'title 4 [channel 4].mp4' },
			{ name : 'title 4 [channel 4].jpg' },
			{ name : 'title 4 [channel 4].description' },
			{
				name : 'title 4 [channel 4].info.json',
				json : { id : 'id4', title : 'title 4', channel : 'channel 4' },
			},
		];

		let readJSONSpy: jest.SpyInstance;
		let recurseSpy: jest.SpyInstance;

		beforeAll(() => {
			recurseSpy  = jest.spyOn(fs, 'recurse');
			readJSONSpy = jest.spyOn(fs, 'readJSON');
		});

		beforeEach(() => {
			// eslint-disable-next-line promise/prefer-await-to-callbacks -- allow callbacks in `fs.recurse`
			recurseSpy.mockImplementation((outputDir: string, callback: { file : Parameters<typeof fs.recurse>[1]['file'] }) => {
				if (callback.file) {
					for (const file of files) {
						// posix function is used since path.sep is mocked to '/'
						callback.file(fs.posix.joinPath(outputDir, file.name), file.name, {} as fs.Dirent);
					}
				}
			});

			readJSONSpy.mockImplementation((filepath: string) => {
				const filename = filepath.split('/').pop();
				return files.filter(({ name }) => name === filename).pop()?.json;
			});

			String.prototype.toFilename = function() {
				return this.replace(badSymbols, '');
			};
		});

		afterAll(() => {
			recurseSpy.mockRestore();
			readJSONSpy.mockRestore();
		});

		it('should output files to rename', () => {
			downloader.validate(profile);

			expect(logger.warn).toHaveBeenCalledWith('Rename');
			expect(logger.log).toHaveBeenCalledWith('\tOld name: title 2 [channel 2].id2');
			expect(logger.log).toHaveBeenCalledWith('\tNew name: new title 2 [channel 2].id2');

			expect(logger.warn).toHaveBeenCalledWith('Rename');
			expect(logger.log).toHaveBeenCalledWith('\tOld name: title 3?*:<> [channel 3].id3');
			expect(logger.log).toHaveBeenCalledWith('\tNew name: title 3 [channel 3].id3');

			expect(logger.warn).toHaveBeenCalledWith('Rename');
			expect(logger.log).toHaveBeenCalledWith('\tOld name: title 4 [channel 4]');
			expect(logger.log).toHaveBeenCalledWith('\tNew name: title 4 [channel 4].id4');
		});

		it('should rename files', () => {
			downloader.validate(profile);

			/* title2 */

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 2 [channel 2].id2.info.json`,
				`output/${profile}/new title 2 [channel 2].id2.info.json`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 2 [channel 2].id2.description`,
				`output/${profile}/new title 2 [channel 2].id2.description`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 2 [channel 2].id2.webp`,
				`output/${profile}/new title 2 [channel 2].id2.webp`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 2 [channel 2].id2.mp4`,
				`output/${profile}/new title 2 [channel 2].id2.mp4`,
			);

			/* title3 */

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 3?*:<> [channel 3].id3.info.json`,
				`output/${profile}/title 3 [channel 3].id3.info.json`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 3?*:<> [channel 3].id3.description`,
				`output/${profile}/title 3 [channel 3].id3.description`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 3?*:<> [channel 3].id3.jpg`,
				`output/${profile}/title 3 [channel 3].id3.jpg`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 3?*:<> [channel 3].id3.mp4`,
				`output/${profile}/title 3 [channel 3].id3.mp4`,
			);

			/* title4 */

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 4 [channel 4].info.json`,
				`output/${profile}/title 4 [channel 4].id4.info.json`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 4 [channel 4].description`,
				`output/${profile}/title 4 [channel 4].id4.description`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 4 [channel 4].jpg`,
				`output/${profile}/title 4 [channel 4].id4.jpg`,
			);

			expect(fs.renameSync).toHaveBeenCalledWith(
				`output/${profile}/title 4 [channel 4].mp4`,
				`output/${profile}/title 4 [channel 4].id4.mp4`,
			);
		});
	});
});
