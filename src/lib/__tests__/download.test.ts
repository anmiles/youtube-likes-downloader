import EventEmitter from 'events';
import path from 'path';
import '@anmiles/jest-extensions';
import type { Readable } from 'stream';

import execa from 'execa';

import { download } from '../download';
import { getDownloadArchive, getLikesFile, getOutputDir } from '../utils/paths';

jest.mock('@anmiles/logger');
jest.mock('execa');

const profile   = 'username';
const outputDir = getOutputDir(profile);

const pipe = jest.fn();

let stdout: Readable | null;
let stderr: Readable | null;

// eslint-disable-next-line @typescript-eslint/promise-function-async
jest.mock('execa', () => jest.fn().mockImplementation(() => Object.assign(Promise.resolve(), { stdout, stderr })));

describe('src/lib/download', () => {
	describe('download', () => {
		beforeEach(() => {
			stdout = { pipe } as unknown as typeof stdout; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
			stderr = new EventEmitter() as unknown as typeof stderr; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
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
				'--write-thumbnail',
				'--write-description',
				'--write-info-json',
				'--js-runtimes', 'node',
			], { cwd: outputDir });
		});

		it('should pipe yt-dlp stdout to process stdout if exists', async () => {
			await download(profile);

			expect(pipe).toHaveBeenCalledWith(process.stdout);
		});

		it('should not pipe yt-dlp stdout if not exists', async () => {
			stdout = null;

			await download(profile);

			expect(pipe).not.toHaveBeenCalledWith();
		});

		it('should throw if stderr had received a data', async () => {
			const promise = download(profile);

			stderr?.emit('data', 'Test error 1');
			stderr?.emit('data', 'Test error 2');

			await expect(promise).rejects.toEqual(new Error('Test error 1\nTest error 2'));
		});
	});
});
