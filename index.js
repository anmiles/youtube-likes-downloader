import fs from 'fs';
import path from 'path';
import open from 'open';
import http from 'http';
import { execa } from 'execa';
import { URL } from 'url';
import { google } from 'googleapis';
import { youtube } from '@googleapis/youtube';

const config = getJSON('./config.json');

async function sleep(ms){
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJSON(filename){
	const jsonString = fs.readFileSync(filename).toString();
	return JSON.parse(jsonString);
}

function writeJSON (filename, jsonString) {
	const json = JSON.stringify(jsonString, null, '    ');
	fs.writeFileSync(filename, json);
}

function getJSON(filename, callback) {
	if (fs.existsSync(filename)) {
		return readJSON(filename);
	}

	return callback().then(json => {
		writeJSON(filename, json);
		return json;
	});
}

function getCallbackURI() {
	return `http://${config.callback.host}:${config.callback.port}/${config.callback.path}`;
}

function getCredentialsInstruction(){
	return [
		'Please create correct OAuth client ID:',
		'Go to https://console.cloud.google.com/apis/credentials/oauthclient',
		'[if applicable] Click "+ Create credentials" and choose "OAuth client ID',
		'Set application type "Web application"',
		`Add authorized redirect URI: ${getCallbackURI()}`,
		'Click "Create"',
		'Click "Download JSON" and download credentials to ./secrets/credentials.json',
		'Start this script again'
	].join('\n\t');
}

function getCredentials() {
	console.log(getCredentialsInstruction());
	process.exit();
}

function checkCredentials(credentials) {
	const callbackURI = getCallbackURI();
	if (credentials.web.redirect_uris[0] === callbackURI) return true;
	throw `Error in credentials file: redirect URI should be ${callbackURI}.\n${getCredentialsInstruction()}`;
}

async function getTokens(auth){
	return new Promise((resolve, reject) => {
		const authUrl = auth.generateAuthUrl({
			access_type: 'offline',
			scope: config.scopes
		});
	
		const server = http.createServer(async (request, response) => {
			response.end('<h1>Please close this page</h1>');

			if (request.url) {
				const url = new URL(`http://${request.headers.host}${request.url}`);
				const code = url.searchParams.get('code');

				if (!code) {
					reject('Search params does not contain a code');
				} else {
					const {tokens} = await auth.getToken(code);
					resolve(tokens);
				}
			}
		});
	
		server.listen(config.callback.port);
		console.log(`Auth page is being opened in your browser. Please allow access to ${config.scopes}`);
		open(authUrl, {app: {name: 'chrome'}});
	});
}

async function getAuth(){
	const credentials = await getJSON('./secrets/credentials.json', getCredentials);
	checkCredentials(credentials);

	const auth = new google.auth.OAuth2(
		credentials.web.client_id,
		credentials.web.client_secret,
		credentials.web.redirect_uris[0]
	);

	const tokens = await getJSON('./secrets/tokens.json', async () => getTokens(auth));

	auth.setCredentials(tokens);
	return auth;
}

async function downloadData() {
	const auth = await getAuth();

	const client = youtube({
		version: 'v3',
		auth
	});

	let pageToken = undefined;
	const videos = [];

	do {
		const items = await client.playlistItems.list({playlistId: 'LL', part: ['snippet'], maxResults: 50, pageToken});
		pageToken = items.data.nextPageToken;
		items.data.items.forEach(item => videos.push(item.snippet));
		console.log(`Getting video IDs (${videos.length} of ${JSON.stringify(items.data.pageInfo.totalResults)})...`);
		await sleep(300);
	} while (pageToken);

	const videosList = videos.map(video => [`# ${video.title}`, `https://www.youtube.com/watch?v=${video.resourceId.videoId}`].join('\n')).join('\n\n');
	const outputFilename = path.join(config.outputDir, 'youtube.json');
	console.log(`Written list in ${outputFilename}`);
	fs.writeFileSync(outputFilename, videosList);
	return outputFilename;
}

async function downloadVideos(batchFile) {
	if (!fs.existsSync(config.mediaDir)) fs.mkdirSync(config.mediaDir);
	const downloadArchive = `${batchFile}.archive.bak`;
	if (!fs.existsSync(downloadArchive)) fs.writeFileSync(downloadArchive, '');

	await execa('yt-dlp', [
		'--batch-file', path.resolve(batchFile),
		'--download-archive', path.resolve(downloadArchive),
		...config.flags
	], {cwd: config.mediaDir}).stdout.pipe(process.stdout);
}

async function main(){
	const youtubeJSON = await downloadData();
	await downloadVideos(youtubeJSON);
}

main();

