import fs from 'fs';
import path from 'path';
import open from 'open';
import http from 'http';
import chalk from 'chalk';
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
		chalk.red('File ./secrets/credentials.json not found!'),
		'To obtain it, please create correct OAuth client ID:',
		'\tGo to https://console.cloud.google.com/apis/credentials/oauthclient',
		'\t[if applicable] Click "+ Create credentials" and choose "OAuth client ID',
		'\tSet application type "Web application"',
		`\tAdd authorized redirect URI: ${getCallbackURI()}`,
		'\tClick "Create"',
		'\tClick "Download JSON" and download credentials to ./secrets/credentials.json',
		'Then start this script again'
	].join('\n');
}

function getCredentials() {
	console.log(chalk.yellow(getCredentialsInstruction()));
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



async function downloadData(outputFilename) {
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
		console.log(chalk.yellow(`Getting video IDs (${videos.length} of ${JSON.stringify(items.data.pageInfo.totalResults)})...`));
		await sleep(300);
	} while (pageToken);

	const videosList = videos.map(video => [`# ${video.title}`, `https://www.youtube.com/watch?v=${video.resourceId.videoId}`].join('\n')).join('\n\n');
	console.log(chalk.green(`Written list in ${outputFilename}`));
	fs.writeFileSync(outputFilename, videosList);
}

async function downloadVideos(inputFilename) {
	if (!fs.existsSync(config.mediaDir)) fs.mkdirSync(config.mediaDir);
	const downloadArchive = `${inputFilename}.archive.bak`;
	if (!fs.existsSync(downloadArchive)) fs.writeFileSync(downloadArchive, '');

	const args = ['yt-dlp', [
		'--batch-file', path.resolve(inputFilename),
		'--download-archive', path.resolve(downloadArchive),
		...config.flags
	], {cwd: config.mediaDir}];

	const stopIf = () => {
		distinctLines(downloadArchive);
		const inputs = (getFileLength(inputFilename) + 1) / 3;
		const outputs = getFileLength(downloadArchive);
		console.log(chalk.yellow(`\nDownloaded ${outputs} videos from ${inputs}...`));
		return outputs === inputs;
	};

	if (config.restart.enabled) {
		await execaRestart(...args, stopIf);
	} else {
		if (!stopIf()) await execa(...args).stdout.pipe(process.stdout);
	}
}

function distinctLines(filename) {
	const lines = fs.readFileSync(filename).toString().split(/\n/g);
	const uniqueLines = [...new Set(lines)];
	fs.writeFileSync(filename, uniqueLines.join('\n'));
}

function getFileLength(filename) {
	return fs.readFileSync(filename).toString().trim().split(/\n/g).length;
}

async function execaRestart(file, args, options, stopIf) {
	while (true) {
		if (stopIf()) break;
		const ytDLP = execa(file, args, options);
		ytDLP.stdout.pipe(process.stdout);
		await sleep(config.restart.milliSeconds);
		process.kill(ytDLP.pid);
	}
}

async function main(){
	const youtubeJSON = path.join(config.outputDir, 'youtube.json');
	await downloadData(youtubeJSON);
	await downloadVideos(youtubeJSON);
	console.log(chalk.green('Done!'));
}

main();

