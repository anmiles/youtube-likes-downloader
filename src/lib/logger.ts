import * as colorette from 'colorette';

export { log, info, warn, error };
export default { log, info, warn, error };

function log(message: string): void {
	console.log(message);
}

function info(message: string): void {
	console.log(colorette.greenBright(message));
}

function warn(message: string): void {
	console.warn(colorette.yellowBright(message));
}

function error(message: string): never {
	console.error(`${colorette.redBright(message)}\n`);
	process.exit(1);
}
