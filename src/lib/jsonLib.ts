import fs from 'fs';
import { error } from './logger';

import * as jsonLib from './jsonLib';

export function readJSON<T>(filename: string): T {
	const jsonString = fs.readFileSync(filename).toString();
	return JSON.parse(jsonString) as T;
}

export function writeJSON<T>(filename: string, json: T): void {
	const jsonString = JSON.stringify(json, null, '    ');
	fs.writeFileSync(filename, jsonString);
}

export function getJSON<T>(filename: string, createCallback: () => Exclude<T, Promise<any>>): T {
	if (fs.existsSync(filename)) {
		return jsonLib.readJSON(filename);
	}

	const json = createCallback();
	jsonLib.checkJSON(filename, json);
	jsonLib.writeJSON(filename, json);
	return json;
}

export async function getJSONAsync<T>(filename: string, createCallbackAsync: () => Promise<T>): Promise<T> {
	if (fs.existsSync(filename)) {
		return jsonLib.readJSON(filename);
	}

	const json = await createCallbackAsync();
	jsonLib.checkJSON(filename, json);
	jsonLib.writeJSON(filename, json);
	return json;
}

export function checkJSON<T>(filename: string, json: T): void {
	if (json) {
		return;
	}
	error(`File ${filename} doesn't exist and should be created with initial data, but function createCallback returned nothing`);
}
