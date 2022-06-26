import fs from 'fs';
import * as paths from '../paths';

const mock: Record<keyof typeof paths, jest.Mock<any, any>> = {
	getOutputDir       : jest.fn(),
	getProfilesFile    : jest.fn(),
	getDownloadArchive : jest.fn(),
	getLikesFile       : jest.fn(),
	getSecretsFile     : jest.fn(),
	getCredentialsFile : jest.fn(),
};
jest.mock('../paths', () => mock);
const original = jest.requireActual('../paths') as typeof paths;

jest.mock('fs', () => ({
	mkdirSync     : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => fileExists),
}));

jest.mock('path', () => ({
	join : jest.fn().mockImplementation((...args) => args.join('/')),
}));

const profile         = 'username';
const outputDir       = 'output/username';
const downloadArchive = 'input/username.ytdlp';
const likesFile       = 'input/username.txt';

let fileExists: boolean;

describe('src/lib/paths', () => {
	describe('getOutputDir', () => {
		it('should create outputDir if not exists', () => {
			fileExists = false;

			original.getOutputDir(profile);

			expect(fs.mkdirSync).toBeCalledWith(outputDir);
		});

		it('should not make outputDir if already exists', () => {
			fileExists = true;

			original.getOutputDir(profile);

			expect(fs.mkdirSync).not.toBeCalled();
		});

		it('should return outputDir', () => {
			const result = original.getOutputDir(profile);

			expect(result).toEqual(outputDir);
		});
	});

	describe('getDownloadArchive', () => {
		it('should create empty downloadArchive if not exists', () => {
			fileExists = false;

			original.getDownloadArchive(profile);

			expect(fs.writeFileSync).toBeCalledWith(downloadArchive, '');
		});

		it('should not make downloadArchive if already exists', () => {
			fileExists = true;

			original.getDownloadArchive(profile);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return downloadArchive', () => {
			const result = original.getDownloadArchive(profile);

			expect(result).toEqual(downloadArchive);
		});
	});

	describe('getLikesFile', () => {
		it('should create empty likesFile if not exists', () => {
			fileExists = false;

			original.getLikesFile(profile);

			expect(fs.writeFileSync).toBeCalledWith(likesFile, '');
		});

		it('should not make likesFile if already exists', () => {
			fileExists = true;

			original.getLikesFile(profile);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return likesFile', () => {
			const result = original.getLikesFile(profile);

			expect(result).toEqual(likesFile);
		});
	});

	describe('getProfilesFile', () => {
		it('should return profiles file', () => {
			const result = original.getProfilesFile();

			expect(result).toEqual('input/profiles.json');
		});
	});
});
