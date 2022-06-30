import fs from 'fs';
import { error } from './logger';

import jsonLib from './jsonLib';

export { getJSON, getJSONAsync, writeJSON };
export default { getJSON, getJSONAsync, writeJSON, readJSON, checkJSON };

function getJSON<T>(filename: string, createCallback: () => Exclude<T, Promise<any>>): T {
	if (fs.existsSync(filename)) {
		return jsonLib.readJSON(filename);
	}

	const json = createCallback();
	jsonLib.checkJSON(filename, json);
	jsonLib.writeJSON(filename, json);
	return json;
}

async function getJSONAsync<T>(filename: string, createCallbackAsync: () => Promise<T>): Promise<T> {
	if (fs.existsSync(filename)) {
		return jsonLib.readJSON(filename);
	}

	const json = await createCallbackAsync();
	jsonLib.checkJSON(filename, json);
	jsonLib.writeJSON(filename, json);
	return json;
}

function writeJSON<T>(filename: string, json: T): void {
	const jsonString = JSON.stringify(json, null, '    ');
	fs.writeFileSync(filename, jsonString);
}

function readJSON<T>(filename: string): T {
	const jsonString = fs.readFileSync(filename).toString();
	return JSON.parse(jsonString) as T;
}

function checkJSON<T>(filename: string, json: T): void {
	if (json) {
		return;
	}
	error(`File ${filename} doesn't exist and should be created with initial data, but function createCallback returned nothing`);
}
