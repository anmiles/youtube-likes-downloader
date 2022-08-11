import http from 'http';
import path from 'path';
import * as colorette from 'colorette';
import type GoogleApis from 'googleapis';
import jsonLib from '../jsonLib';
import logger from '../logger';
import type { Secrets } from '../../types';

import secrets from '../secrets';
const original = jest.requireActual('../secrets').default as typeof secrets;
jest.mock<typeof secrets>('../secrets', () => ({
	getSecrets        : jest.fn(),
	getCredentials    : jest.fn(),
	createCredentials : jest.fn(),
	checkSecrets      : jest.fn(),
	getSecretsError   : jest.fn().mockImplementation(() => secretsError),
}));

jest.mock<Partial<typeof http>>('http', () => ({
	createServer : jest.fn().mockImplementation((callback) => {
		serverCallback = callback;

		return {
			listen,
			close,
		};
	}),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock<Partial<typeof colorette>>('colorette', () => ({
	yellow : jest.fn().mockImplementation((text) => `yellow:${text}`),
}));

jest.mock<Partial<typeof jsonLib>>('../jsonLib', () => ({
	getJSON      : jest.fn().mockImplementation(() => json),
	getJSONAsync : jest.fn().mockImplementation(async () => json),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	info  : jest.fn(),
	error : jest.fn().mockImplementation((error) => {
		throw error;
	}) as jest.Mock<never, any>,
}));

const profile          = 'username1';
const secretsFile      = 'secrets/username1.json';
const credentialsFile  = 'secrets/username1.credentials.json';
const wrongRedirectURI = 'wrong_redirect_uri';

const secretsError = 'secretsError';

const secretsJSON: Secrets = {
	web : {
		/* eslint-disable camelcase */
		client_id                   : 'client_id.apps.googleusercontent.com',
		project_id                  : 'project_id',
		auth_uri                    : 'https://accounts.google.com/o/oauth2/auth',
		token_uri                   : 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url : 'https://www.googleapis.com/oauth2/v1/certs',
		client_secret               : 'client_secret',
		redirect_uris               : [ 'http://localhost:6006/oauthcallback' ],
		/* eslint-enable camelcase */
	},
};

const credentialsJSON = {
	token : {},
};

let json: object;

const code    = 'code';
const authUrl = 'https://authUrl';
const auth    = {
	generateAuthUrl : jest.fn().mockReturnValue(authUrl),
	getToken        : jest.fn().mockReturnValue({ tokens : credentialsJSON }),
} as unknown as GoogleApis.Common.OAuth2Client;

let request: http.IncomingMessage;

const response = {
	end : jest.fn(),
} as unknown as http.ServerResponse;

let serverCallback: (
	request: http.IncomingMessage,
	response: http.ServerResponse
) => Promise<typeof credentialsJSON>;

let closedTime: number;

const listen = jest.fn();
const close  = jest.fn().mockImplementation(() => {
	closedTime = new Date().getTime();
});

describe('src/lib/secrets', () => {
	describe('getSecrets', () => {
		const getJSONSpy = jest.spyOn(jsonLib, 'getJSON');

		beforeEach(() => {
			json = secretsJSON;
		});

		it('should get json from secrets file', async () => {
			await original.getSecrets(profile);

			expect(getJSONSpy).toBeCalled();
			expect(getJSONSpy.mock.calls[0][0]).toEqual(secretsFile);
		});

		it('should fallback to error', async () => {
			await original.getSecrets(profile);

			expect(getJSONSpy.mock.calls[0][1]).toThrowError(secretsError);
		});

		it('should check secrets', async () => {
			await original.getSecrets(profile);

			expect(secrets.checkSecrets).toBeCalledWith(profile, json, secretsFile);
		});

		it('should return secrets', async () => {
			const result = await original.getSecrets(profile);

			expect(result).toEqual(secretsJSON);
		});
	});

	describe('getCredentials', () => {
		const getJSONAsyncSpy = jest.spyOn(jsonLib, 'getJSONAsync');

		beforeEach(() => {
			json = credentialsJSON;
		});

		it('should get json from credentials file', async () => {
			await original.getCredentials(profile, auth);

			expect(getJSONAsyncSpy).toBeCalled();
			expect(getJSONAsyncSpy.mock.calls[0][0]).toEqual(credentialsFile);
		});

		it('should fallback to createCredentials', async () => {
			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			await fallback();

			expect(secrets.createCredentials).toBeCalledWith(profile, auth);
		});

		it('should return credentials', async () => {
			const result = await original.getCredentials(profile, auth);

			expect(result).toEqual(credentialsJSON);
		});
	});

	describe('createCredentials', () => {
		function willOpen(request: http.IncomingMessage, timeout: number) {
			setTimeout(async () => {
				await serverCallback(request, response);
			}, timeout);
		}

		beforeEach(() => {
			request = {
				url     : `/request.url?code=${code}`,
				headers : {
					host : 'localhost:6006',
				},
			} as http.IncomingMessage;
		});

		it('should generate authUrl', async () => {
			willOpen(request, 100);

			await original.createCredentials(profile, auth);

			expect(auth.generateAuthUrl).toBeCalledWith({
				// eslint-disable-next-line camelcase
				access_type : 'offline',
				scope       : [ 'https://www.googleapis.com/auth/youtube.readonly' ],
			});
		});

		it('should create server on 6006 port', async () => {
			willOpen(request, 100);

			await original.createCredentials(profile, auth);

			expect(http.createServer).toBeCalled();
			expect(listen).toBeCalledWith(6006);
		});

		it('should ask to open browser page', async () => {
			willOpen(request, 100);

			await original.createCredentials(profile, auth);

			expect(logger.info).toBeCalledWith(`Please open yellow:https://authUrl in your browser using google profile for yellow:${profile} and allow access to yellow:https://www.googleapis.com/auth/youtube.readonly`);
		});

		it('should ask to close webpage', async () => {
			willOpen(request, 100);

			await original.createCredentials(profile, auth);

			expect(response.end).toBeCalledWith('<h1>Please close this page and return to application</h1>');
		});

		it('should close server if request.url is truthy', async () => {
			willOpen(request, 100);

			await original.createCredentials(profile, auth);

			expect(close).toBeCalled();
		});

		it('should only resolve when request.url is truthy', async () => {
			const emptyRequestTime = 100;
			const requestTime      = 200;
			const emptyRequest     = { ...request } as http.IncomingMessage;
			emptyRequest.url       = undefined;

			const before = new Date().getTime();
			willOpen(emptyRequest, emptyRequestTime);
			willOpen(request, requestTime);

			const result = await original.createCredentials(profile, auth);
			const after  = new Date().getTime();

			expect(close).toBeCalledTimes(1);
			expect(closedTime - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(after - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(result).toEqual(credentialsJSON);
		});

		it('should only resolve when request.url contains no code', async () => {
			const noCodeRequestTime = 100;
			const requestTime       = 200;
			const noCodeRequest     = { ...request } as http.IncomingMessage;
			noCodeRequest.url       = '/request.url?param=value';

			const before = new Date().getTime();
			willOpen(noCodeRequest, noCodeRequestTime);
			willOpen(request, requestTime);

			const result = await original.createCredentials(profile, auth);
			const after  = new Date().getTime();

			expect(close).toBeCalledTimes(1);
			expect(closedTime - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(after - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(result).toEqual(credentialsJSON);
		});

		it('should return credentials JSON', async () => {
			willOpen(request, 100);

			const result = await original.createCredentials(profile, auth);

			expect(result).toEqual(credentialsJSON);
		});
	});

	describe('checkSecrets', () => {
		it('should return true if redirect_uri is correct', () => {
			const result = original.checkSecrets(profile, secretsJSON, secretsFile);

			expect(result).toBe(true);
		});

		it('should output error if redirect_uri is incorrect', () => {
			const wrongSecretsJSON                = { ...secretsJSON };
			wrongSecretsJSON.web.redirect_uris[0] = wrongRedirectURI;
			const func                            = () => original.checkSecrets(profile, wrongSecretsJSON, secretsFile);

			expect(func).toThrowError('Error in credentials file: redirect URI should be http://localhost:6006/oauthcallback.\nsecretsError');
		});
	});

	describe('getSecretsError', () => {
		it('should return error message with instructions', () => {
			const result = original.getSecretsError(profile, secretsFile);
			expect(result).toEqual(`File ${secretsFile} not found!\n\
To obtain it, please create correct OAuth client ID:\n\
\tGo to https://console.cloud.google.com/apis/credentials/oauthclient\n\
\t[if applicable] Click "+ Create credentials" and choose "OAuth client ID\n\
\tSet application type "Web application"\n\
\tAdd authorized redirect URI: http://localhost:6006/oauthcallback\n\
\tClick "Create"\n\
\tClick "Download JSON" and download credentials to ./secrets/${profile}.json\n\
Then start this script again`);
		});
	});
});
