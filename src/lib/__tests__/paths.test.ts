import fs from 'fs';
import path from 'path';
import '@anmiles/prototypes';

import paths from '../paths';
const original = jest.requireActual('../paths').default as typeof paths;
jest.mock<typeof paths>('../paths', () => ({
	getOutputDir        : jest.fn().mockImplementation(() => outputDir),
	getDownloadArchive  : jest.fn().mockImplementation(() => downloadArchive),
	getLikesFile        : jest.fn().mockImplementation(() => likesFile),
	getIncludeLikesFile : jest.fn().mockImplementation(() => includeLikesFile),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	mkdirSync     : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => exists),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join    : jest.fn().mockImplementation((...args) => args.join('/')),
	dirname : jest.fn().mockImplementation((arg) => arg.split('/').slice(0, -1).join('/')),
}));

const ensureDirSpy  = jest.spyOn(fs, 'ensureDir').mockImplementation((dirPath) => dirPath);
const ensureFileSpy = jest.spyOn(fs, 'ensureFile').mockImplementation((filePath) => filePath);

const profile          = 'username';
const outputDir        = 'output/username';
const downloadArchive  = 'input/username.ytdlp';
const likesFile        = 'input/username.txt';
const includeLikesFile = 'input/username.include.txt';

let exists: boolean;

describe('src/lib/paths', () => {
	describe('getOutputDir', () => {
		it('should call ensureDir', () => {
			original.getOutputDir(profile);

			expect(ensureDirSpy).toHaveBeenCalledWith(outputDir);
		});

		it('should return outputDir', () => {
			const result = original.getOutputDir(profile);

			expect(result).toEqual(outputDir);
		});
	});

	describe('getDownloadArchive', () => {
		it('should call ensureFile', () => {
			original.getDownloadArchive(profile);

			expect(ensureFileSpy).toHaveBeenCalledWith(downloadArchive);
		});

		it('should return downloadArchive', () => {
			const result = original.getDownloadArchive(profile);

			expect(result).toEqual(downloadArchive);
		});
	});

	describe('getLikesFile', () => {
		it('should call ensureFile', () => {
			original.getLikesFile(profile);

			expect(ensureFileSpy).toHaveBeenCalledWith(likesFile);
		});

		it('should return likesFile', () => {
			const result = original.getLikesFile(profile);

			expect(result).toEqual(likesFile);
		});
	});

	describe('getIncludeLikesFile', () => {
		it('should call ensureFile', () => {
			original.getIncludeLikesFile(profile);

			expect(ensureFileSpy).toHaveBeenCalledWith(includeLikesFile);
		});

		it('should return includeLikesFile', () => {
			const result = original.getIncludeLikesFile(profile);

			expect(result).toEqual(includeLikesFile);
		});
	});
});
