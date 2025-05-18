import path from 'path';

import '@anmiles/jest-extensions';
import { log, warn } from '@anmiles/logger';
import execa from 'execa';
import mockFs from 'mock-fs';

import { download, validate } from '../downloader';
import { getDownloadArchive, getLikesFile, getOutputDir } from '../utils/paths';

jest.mock('@anmiles/logger');

const profile   = 'username';
const outputDir = getOutputDir(profile);

const pipe = jest.fn();
let hasStdout: boolean;

jest.mock('execa', () => jest.fn().mockImplementation(() => ({
	stdout: !hasStdout
		? null
		: {
				pipe,
			},
})));

describe('src/lib/downloader', () => {
	describe('download', () => {
		beforeEach(() => {
			hasStdout = true;
		});

		it('should call yt-dlp', async () => {
			await download(profile);

			expect(execa).toHaveBeenCalledWith('yt-dlp', [
				'--batch-file', path.resolve(getLikesFile(profile)),
				'--download-archive', path.resolve(getDownloadArchive(profile)),
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
			], { cwd: outputDir });
		});

		it('should pipe yt-dlp stdout to process stdout if exists', async () => {
			hasStdout = true;

			await download(profile);

			expect(pipe).toHaveBeenCalledWith(process.stdout);
		});

		it('should not pipe yt-dlp stdout if not exists', async () => {
			hasStdout = false;

			await download(profile);

			expect(pipe).not.toHaveBeenCalledWith();
		});
	});

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
	});
});
