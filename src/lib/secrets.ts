import http from 'http';
import path from 'path';
import * as colorette from 'colorette';
import type GoogleApis from 'googleapis';
import type { Secrets } from '../types';
import { getJSON, getJSONAsync } from './jsonLib';
import { info, error } from './logger';
import { getSecretsFile, getCredentialsFile } from './paths';

import * as secrets from './secrets';

const callbackPort = 6006;
const callbackURI  = `http://localhost:${callbackPort}/oauthcallback`;
const scope        = [ 'https://www.googleapis.com/auth/youtube.readonly' ];

export async function getSecrets(profile: string): Promise<Secrets> {
	const secretsFile   = getSecretsFile(profile);
	const secretsObject = getJSON<Secrets>(secretsFile, () => error(secrets.getSecretsError(profile, secretsFile)));
	secrets.checkSecrets(profile, secretsObject, secretsFile);
	return secretsObject;
}

export async function getCredentials(profile: string, auth: GoogleApis.Common.OAuth2Client): Promise<GoogleApis.Auth.Credentials> {
	const credentialsFile = getCredentialsFile(profile);
	return getJSONAsync(credentialsFile, () => secrets.createCredentials(profile, auth));
}

export async function createCredentials(profile: string, auth: GoogleApis.Auth.OAuth2Client): Promise<GoogleApis.Auth.Credentials> {
	return new Promise((resolve) => {
		const authUrl = auth.generateAuthUrl({
			// eslint-disable-next-line camelcase
			access_type : 'offline',
			scope,
		});

		const server = http.createServer(async (request, response) => {
			response.end('<h1>Please close this page and return to application</h1>');

			if (request.url) {
				const url  = new URL(`http://${request.headers.host}${request.url}`);
				const code = url.searchParams.get('code');

				if (!code) {
					return;
				}

				server.close();
				const { tokens } = await auth.getToken(code);
				resolve(tokens);
			}
		});

		server.listen(callbackPort);
		info(`Please open ${colorette.yellow(authUrl)} in your browser using google profile for ${colorette.yellow(profile)} and allow access to ${colorette.yellow(scope.join(','))}`);
	});
}

export function checkSecrets(profile: string, secretsObject: Secrets, secretsFile: string): true | never {
	if (secretsObject.web.redirect_uris[0] === callbackURI) {
		return true;
	}
	error(`Error in credentials file: redirect URI should be ${callbackURI}.\n${secrets.getSecretsError(profile, secretsFile)}`);
}

export function getSecretsError(profile: string, secretsFile: string) {
	return [
		`File ${secretsFile} not found!`,
		'To obtain it, please create correct OAuth client ID:',
		'\tGo to https://console.cloud.google.com/apis/credentials/oauthclient',
		'\t[if applicable] Click "+ Create credentials" and choose "OAuth client ID',
		'\tSet application type "Web application"',
		`\tAdd authorized redirect URI: ${callbackURI}`,
		'\tClick "Create"',
		`\tClick "Download JSON" and download credentials to ./secrets/${profile}.json`,
		'Then start this script again',
	].join('\n');
}
