import fs from 'fs';
import path from 'path';
import execa from 'execa';
import paths from '../paths';

import downloader from '../downloader';

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	resolve : jest.fn().mockImplementation((relativePath) => `/rootPath/${relativePath}`),
}));

jest.mock('execa', () => jest.fn().mockImplementation(() => ({
	stdout : !hasStdout ? null : {
		pipe,
	},
})));

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
				'--output', '%(title)s [%(channel)s]',
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

		it('should return yt-dlp process', async () => {
			hasStdout = true;

			const proc = await downloader.download(profile);

			expect(proc).toEqual({
				stdout : { pipe },
			});
		});
	});
});
