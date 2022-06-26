import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { getProfiles } from '../profiles';
import { getSecrets, getCredentials } from '../secrets';

import * as auth from '../auth';
const original = jest.requireActual('../auth') as typeof auth;
jest.mock('../auth', () => ({
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

jest.mock('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => profiles),
}));

jest.mock('../secrets', () => ({
	getSecrets     : jest.fn().mockImplementation(async () => secrets),
	getCredentials : jest.fn().mockImplementation(async () => credentials),
}));

const profile  = 'username';
const profiles = [ 'username1', 'username2' ];
const youtube  = 'youtubeClient';

const googleAuth = {
	setCredentials : jest.fn(),
};

const secrets = {
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
			expect(getProfiles).toBeCalledWith();
		});

		it('should auth each profile', async () => {
			await original.login();
			profiles.forEach((profile) => {
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
			expect(getSecrets).toBeCalledWith(profile);
		});

		it('should get credentials', async () => {
			await original.getAuth(profile);
			expect(getCredentials).toBeCalledWith(profile, googleAuth);
		});

		it('should create OAuth2 instance', async () => {
			await original.getAuth(profile);
			expect(google.auth.OAuth2).toBeCalledWith(secrets.web.client_id, secrets.web.client_secret, secrets.web.redirect_uris[0]);
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
