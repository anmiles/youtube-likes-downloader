import path from 'path';
import execa from 'execa';
import paths from '../paths';

import downloader from '../downloader';

jest.mock<Partial<typeof path>>('path', () => ({
	resolve : jest.fn().mockImplementation((relativePath) => `/rootPath/${relativePath}`),
}));

jest.mock('execa', () => jest.fn().mockImplementation(() => ({
	stdout : !hasStdout ? null : {
		pipe,
	},
})));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getOutputDir       : jest.fn().mockImplementation(() => outputDir),
	getDownloadArchive : jest.fn().mockImplementation(() => downloadArchive),
}));

const profile         = 'username';
const likesFile       = 'likesFile';
const outputDir       = 'outputDir';
const downloadArchive = 'downloadArchive';

const pipe = jest.fn();
let hasStdout: boolean;

describe('src/lib/downloader', () => {
	describe('download', () => {
		beforeEach(() => {
			hasStdout = true;
		});

		it('should get outputDir', async () => {
			await downloader.download(profile, likesFile);

			expect(paths.getOutputDir).toBeCalledWith(profile);
		});

		it('should get downloadArchive', async () => {
			await downloader.download(profile, likesFile);

			expect(paths.getDownloadArchive).toBeCalledWith(profile);
		});

		it('should call yt-dlp', async () => {
			await downloader.download(profile, likesFile);

			expect(execa).toBeCalledWith('yt-dlp', [
				'--batch-file', '/rootPath/likesFile',
				'--download-archive', '/rootPath/downloadArchive',
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
			], { cwd : outputDir });
		});

		it('should pipe yt-dlp stdout to process stdout if exists', async () => {
			hasStdout = true;

			await downloader.download(profile, likesFile);

			expect(pipe).toBeCalledWith(process.stdout);
		});

		it('should not pipe yt-dlp stdout if not exists', async () => {
			hasStdout = false;

			await downloader.download(profile, likesFile);

			expect(pipe).not.toBeCalledWith();
		});

		it('should return yt-dlp process', async () => {
			hasStdout = true;

			const proc = await downloader.download(profile, likesFile);

			expect(proc).toEqual({
				stdout : { pipe },
			});
		});
	});
});
