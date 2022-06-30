import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { getProfiles } from './profiles';
import { getCredentials, getSecrets } from './secrets';

import auth from './auth';

export { login, getClient };
export default { login, getClient, getAuth };

async function login(): Promise<void> {
	const profiles = getProfiles();

	for (const profile of profiles) {
		await auth.getAuth(profile);
	}
}

async function getClient(profile: string): Promise<GoogleApis.youtube_v3.Youtube> {
	const googleAuth = await auth.getAuth(profile);

	return google.youtube({
		version : 'v3',
		auth    : googleAuth,
	});
}

async function getAuth(profile: string): Promise<GoogleApis.Common.OAuth2Client> {
	const secrets = await getSecrets(profile);

	const googleAuth = new google.auth.OAuth2(
		secrets.web.client_id,
		secrets.web.client_secret,
		secrets.web.redirect_uris[0],
	);

	const tokens = await getCredentials(profile, googleAuth);
	googleAuth.setCredentials(tokens);
	return googleAuth;
}
