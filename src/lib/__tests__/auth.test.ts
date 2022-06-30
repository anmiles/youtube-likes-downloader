import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import profiles from '../profiles';
import secrets from '../secrets';

import auth from '../auth';
const original = jest.requireActual('../auth').default as typeof auth;
jest.mock<typeof auth>('../auth', () => ({
	login     : jest.fn(),
	getClient : jest.fn(),
	getAuth   : jest.fn().mockImplementation(async () => googleAuth),
}));

jest.mock('googleapis', () => ({
	google : {
		auth : {
			OAuth2 : jest.fn().mockImplementation(() => googleAuth),
		},
		youtube : jest.fn().mockImplementation(() => youtube),
	},
}));

jest.mock<Partial<typeof profiles>>('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => allProfiles),
}));

jest.mock<Partial<typeof secrets>>('../secrets', () => ({
	getSecrets     : jest.fn().mockImplementation(async () => secretsObject),
	getCredentials : jest.fn().mockImplementation(async () => credentials),
}));

const profile     = 'username';
const allProfiles = [ 'username1', 'username2' ];
const youtube     = 'youtubeClient';

const googleAuth = {
	setCredentials : jest.fn(),
};

const secretsObject = {
	web : {
		/* eslint-disable camelcase */
		client_id     : 'client_id',
		client_secret : 'client_secret',
		redirect_uris : [ 'redirect_uri' ],
		/* eslint-enable camelcase */
	},
};

const credentials = 'credentials' as GoogleApis.Auth.Credentials;

describe('src/lib/auth', () => {
	describe('login', () => {
		it('should get profiles', async () => {
			await original.login();
			expect(profiles.getProfiles).toBeCalledWith();
		});

		it('should auth each profile', async () => {
			await original.login();
			allProfiles.forEach((profile) => {
				expect(auth.getAuth).toBeCalledWith(profile);
			});
		});

		it('should return youtube client', async () => {
			const client = await original.getClient(profile);
			expect(client).toEqual(youtube);
		});
	});

	describe('getClient', () => {
		it('should get google auth', async () => {
			await original.getClient(profile);
			expect(auth.getAuth).toBeCalledWith(profile);
		});

		it('should create youtube client', async () => {
			await original.getClient(profile);
			expect(google.youtube).toBeCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return youtube client', async () => {
			const client = await original.getClient(profile);
			expect(client).toEqual(youtube);
		});
	});

	describe('getAuth', () => {
		it('should get secrets', async () => {
			await original.getAuth(profile);
			expect(secrets.getSecrets).toBeCalledWith(profile);
		});

		it('should get credentials', async () => {
			await original.getAuth(profile);
			expect(secrets.getCredentials).toBeCalledWith(profile, googleAuth);
		});

		it('should create OAuth2 instance', async () => {
			await original.getAuth(profile);
			expect(google.auth.OAuth2).toBeCalledWith(secretsObject.web.client_id, secretsObject.web.client_secret, secretsObject.web.redirect_uris[0]);
		});

		it('should set credentials', async () => {
			await original.getAuth(profile);
			expect(googleAuth.setCredentials).toBeCalledWith(credentials);
		});

		it('should return google auth', async () => {
			const result = await original.getAuth(profile);
			expect(result).toEqual(googleAuth);
		});
	});
});
