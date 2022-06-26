import * as colorette from 'colorette';

export function log(message: string): void {
	console.log(message);
}

export function info(message: string): void {
	console.log(colorette.greenBright(message));
}

export function warn(message: string): void {
	console.warn(colorette.yellowBright(message));
}

export function error(message: string): never {
	console.error(`${colorette.redBright(message)}\n`);
	process.exit(1);
}
