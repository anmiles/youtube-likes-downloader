import fs from 'fs';
import jsonLib from '../jsonLib';
import logger from '../logger';
import paths from '../paths';

import profiles from '../profiles';
const original = jest.requireActual('../profiles').default as typeof profiles;
jest.mock<typeof profiles>('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => existingProfiles),
	setProfiles : jest.fn(),
	create      : jest.fn(),
	migrate     : jest.fn(),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	mkdirSync     : jest.fn(),
	renameSync    : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation((file) => existingFiles.includes(file)),
}));

jest.mock<Partial<typeof jsonLib>>('../jsonLib', () => ({
	getJSON   : jest.fn().mockImplementation(() => json),
	writeJSON : jest.fn(),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	log   : jest.fn(),
	warn  : jest.fn(),
	error : jest.fn().mockImplementation(() => {
		throw mockError;
	}),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getProfilesFile : jest.fn().mockImplementation(() => profilesFile),
}));

const json             = { key : 'value' };
const existingProfiles = [ 'username1', 'username2' ];
const profilesFile     = 'profilesFile';
const profile1         = 'username1';
const profile2         = 'username2';
const allProfiles      = [ profile1, profile2 ];

const mockError = 'mockError';

let existingFiles: string[] = [];

beforeEach(() => {
	existingFiles = [];
});

describe('src/lib/profiles', () => {

	describe('getProfiles', () => {
		const getJSONSpy = jest.spyOn(jsonLib, 'getJSON');

		it('should get json from profiles file', () => {
			original.getProfiles();

			expect(getJSONSpy).toBeCalled();
			expect(getJSONSpy.mock.calls[0][0]).toEqual(profilesFile);
		});

		it('should fallback to empty profiles array', () => {
			original.getProfiles();

			const fallback = getJSONSpy.mock.calls[0][1];

			expect(fallback()).toEqual([]);
		});

		it('should return JSON', () => {
			const result = original.getProfiles();

			expect(result).toEqual(json);
		});
	});

	describe('setProfiles', () => {
		it('should write json to profiles file', () => {
			original.setProfiles(allProfiles);

			expect(jsonLib.writeJSON).toBeCalledWith(profilesFile, allProfiles);
		});
	});
	describe('create', () => {
		it('should output error and do nothing if profile is falsy', () => {
			const func = () => original.create('');

			expect(func).toThrowError(mockError);
			expect(logger.error).toBeCalledWith('Usage: `npm run create profile` where `profile` - is any profile name you want');
		});

		it('should get profiles', () => {
			const newProfile = 'username1';

			original.create(newProfile);

			expect(profiles.getProfiles).toBeCalledWith();
		});

		it('should not save profiles if profile already exists', () => {
			const newProfile = 'username1';

			original.create(newProfile);

			expect(profiles.setProfiles).not.toBeCalled();
		});

		it('should add new profile if not exists', () => {
			const newProfile = 'newProfile';

			original.create(newProfile);

			expect(profiles.setProfiles).toBeCalledWith([ 'username1', 'username2', 'newProfile' ]);
		});
	});

	describe('migrate', () => {
		const migratingProfile = 'username3';

		it('should output error if profile is falsy', () => {
			const func = () => original.migrate('');

			expect(func).toThrowError(mockError);
			expect(logger.error).toBeCalledWith('Usage: `npm run migrate profile` where `profile` - is any profile name you want');
		});

		it('should output error if destination file already exists', () => {
			existingFiles = [ './input/favorites.json', './input/username3.txt' ];
			const func    = () => original.migrate(migratingProfile);

			expect(func).toThrowError(mockError);
			expect(logger.error).toBeCalledWith(`Cannot move '${existingFiles[0]}' to '${existingFiles[1]}', probably data for profile '${migratingProfile}' already exists`);
		});

		it('should output error if nothing to migrate', () => {
			existingFiles = [];
			const func    = () => original.migrate(migratingProfile);

			expect(func).toThrowError(mockError);
			expect(logger.error).toBeCalledWith('There are no files to migrate');
		});

		describe('there are files to migrate', () => {
			const func = () => original.migrate(migratingProfile);

			beforeEach(() => {
				existingFiles = [ './secrets/tokens.json', './input/favorites.json', 'test.json' ];
			});

			it('should create profile', () => {
				func();
				expect(profiles.create).toBeCalledWith(migratingProfile);
			});

			it('should rename existing old files', () => {
				func();

				expect(fs.renameSync).toBeCalledWith('./secrets/tokens.json', './secrets/username3.credentials.json');
				expect(fs.renameSync).toBeCalledWith('./input/favorites.json', './input/username3.txt');
			});

			it('should output progress', () => {
				func();

				expect(logger.log).toBeCalledWith('Moving \'./secrets/tokens.json\' to \'./secrets/username3.credentials.json\'...');
				expect(logger.log).toBeCalledWith('Moving \'./input/favorites.json\' to \'./input/username3.txt\'...');
			});

			it('should warn about manual action', () => {
				func();

				expect(logger.warn).toBeCalledWith('Please move \'./output/\' to \'./output/username3/\' manually');
			});
		});
	});
});
