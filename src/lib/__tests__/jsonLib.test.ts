import fs from 'fs';
import logger from '../logger';
import paths from '../paths';

import jsonLib from '../jsonLib';
const original = jest.requireActual('../jsonLib').default as typeof jsonLib;
jest.mock<typeof jsonLib>('../jsonLib', () => ({
	readJSON     : jest.fn().mockImplementation(() => json),
	writeJSON    : jest.fn(),
	getJSON      : jest.fn(),
	getJSONAsync : jest.fn(),
	checkJSON    : jest.fn(),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	readFileSync  : jest.fn().mockImplementation(() => jsonString),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => fileExists),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	error : jest.fn().mockImplementation(() => {
		throw mockError;
	}),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	ensureFile : jest.fn(),
}));

const filename     = 'filename';
const json         = { key : 'value' };
const jsonString   = JSON.stringify(json, null, '    ');
const fallbackJSON = { fallbackKey : 'fallbackValue' };

const mockError = 'mockError';

const createCallback      = jest.fn().mockReturnValue(fallbackJSON);
const createCallbackAsync = jest.fn().mockResolvedValue(fallbackJSON);

let fileExists: boolean;

describe('src/lib/jsonLib', () => {
	describe('readJSON', () => {
		it('should read specified file', () => {
			original.readJSON(filename);

			expect(fs.readFileSync).toBeCalledWith(filename);
		});

		it('should return parsed JSON', () => {
			const result = original.readJSON(filename);

			expect(result).toEqual(json);
		});
	});

	describe('writeJSON', () => {
		it('should write JSON into specified file', () => {
			original.writeJSON(filename, json);

			expect(fs.writeFileSync).toBeCalledWith(filename, jsonString);
		});
	});

	describe('getJSON', () => {
		it('should call readJSON if file exists', () => {
			fileExists = true;

			original.getJSON(filename, createCallback);

			expect(jsonLib.readJSON).toBeCalledWith(filename);
			expect(createCallback).not.toBeCalled();
		});

		it('should call createCallback if file not exists', () => {
			fileExists = false;

			original.getJSON(filename, createCallback);

			expect(jsonLib.readJSON).not.toBeCalled();
			expect(createCallback).toBeCalledWith();
		});

		it('should write fallback JSON back if file not exists', () => {
			fileExists = false;

			original.getJSON(filename, createCallback);

			expect(jsonLib.checkJSON).toBeCalledWith(filename, fallbackJSON);
			expect(paths.ensureFile).toBeCalledWith(filename);
			expect(jsonLib.writeJSON).toBeCalledWith(filename, fallbackJSON);
		});

		it('should return JSON if file exists', () => {
			fileExists = true;

			const result = original.getJSON(filename, createCallback);

			expect(result).toEqual(json);
		});

		it('should return fallback JSON if file not exists', () => {
			fileExists = false;

			const result = original.getJSON(filename, createCallback);

			expect(result).toEqual(fallbackJSON);
		});
	});

	describe('getJSONAsync', () => {
		it('should call readJSON if file exists', async () => {
			fileExists = true;

			await original.getJSONAsync(filename, createCallbackAsync);

			expect(jsonLib.readJSON).toBeCalledWith(filename);
			expect(createCallbackAsync).not.toBeCalled();
		});

		it('should call createCallback if file not exists', async () => {
			fileExists = false;

			await original.getJSONAsync(filename, createCallbackAsync);

			expect(jsonLib.readJSON).not.toBeCalled();
			expect(createCallbackAsync).toBeCalledWith();
		});

		it('should write fallback JSON back if file not exists', async () => {
			fileExists = false;

			await original.getJSONAsync(filename, createCallbackAsync);

			expect(jsonLib.checkJSON).toBeCalledWith(filename, fallbackJSON);
			expect(jsonLib.writeJSON).toBeCalledWith(filename, fallbackJSON);
		});

		it('should return JSON if file exists', async () => {
			fileExists = true;

			const result = await original.getJSONAsync(filename, createCallbackAsync);

			expect(result).toEqual(json);
		});

		it('should return fallback JSON if file not exists', async () => {
			fileExists = false;

			const result = await original.getJSONAsync(filename, createCallbackAsync);

			expect(result).toEqual(fallbackJSON);
		});
	});

	describe('checkJSON', () => {
		it('should do nothing if json is truthy', () => {
			original.checkJSON(filename, json);

			expect(logger.error).not.toBeCalled();
		});
		it('should output error if json is falsy', () => {
			expect(() => original.checkJSON(filename, '')).toThrowError(mockError);

			expect(logger.error).toBeCalledWith(expect.stringContaining(filename));
		});
	});
});
