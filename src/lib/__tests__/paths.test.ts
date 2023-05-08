import fs from 'fs';
import path from 'path';

import paths from '../paths';
const original = jest.requireActual('../paths').default as typeof paths;
jest.mock<typeof paths>('../paths', () => ({
	ensureDir          : jest.fn().mockImplementation((dirPath) => dirPath),
	ensureFile         : jest.fn().mockImplementation((filePath) => filePath),
	getOutputDir       : jest.fn().mockImplementation(() => outputDir),
	getDownloadArchive : jest.fn().mockImplementation(() => downloadArchive),
	getLikesFile       : jest.fn().mockImplementation(() => likesFile),
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

const profile  = 'username';
const dirPath  = 'dirPath';
const filePath = 'parentDir/filePath';

const outputDir       = 'output/username';
const downloadArchive = 'input/username.ytdlp';
const likesFile       = 'input/username.txt';

let exists: boolean;

describe('src/lib/paths', () => {
	describe('ensureDir', () => {
		it('should create empty dir if not exists', () => {
			exists = false;

			original.ensureDir(dirPath);

			expect(fs.mkdirSync).toBeCalledWith(dirPath, { recursive : true });
		});

		it('should not create empty dir if already exists', () => {
			exists = true;

			original.ensureDir(dirPath);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return dirPath', () => {
			const result = original.ensureDir(dirPath);

			expect(result).toEqual(dirPath);
		});
	});

	describe('ensureFile', () => {
		it('should ensure parent dir', () => {
			exists = false;

			original.ensureFile(filePath);

			expect(paths.ensureDir).toBeCalledWith('parentDir');
		});

		it('should create empty file if not exists', () => {
			exists = false;

			original.ensureFile(filePath);

			expect(fs.writeFileSync).toBeCalledWith(filePath, '');
		});

		it('should not create empty file if already exists', () => {
			exists = true;

			original.ensureFile(filePath);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return filePath', () => {
			const result = original.ensureFile(filePath);

			expect(result).toEqual(filePath);
		});
	});

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
});
