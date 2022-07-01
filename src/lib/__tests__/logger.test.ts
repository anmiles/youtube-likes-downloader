import * as colorette from 'colorette';

import logger from '../logger';

const text = 'text';

const originalConsole = global.console;
global.console.log    = jest.fn();
global.console.info   = jest.fn();
global.console.warn   = jest.fn();
global.console.error  = jest.fn();

const exit = jest.spyOn(process, 'exit').mockImplementation();

afterAll(() => {
	global.console = originalConsole;
});

describe('src/lib/logger', () => {
	describe('log', () => {
		it('should call console.log with original text', () => {
			logger.log(text);

			expect(global.console.log).toBeCalledWith(text);
		});
	});

	describe('info', () => {
		it('should call console.info with bright green text', () => {
			logger.info(text);

			expect(global.console.log).toBeCalledWith(colorette.greenBright(text));
		});
	});

	describe('warn', () => {
		it('should call console.warn with bright yellow text', () => {
			logger.warn(text);

			expect(global.console.warn).toBeCalledWith(colorette.yellowBright(text));
		});
	});

	describe('error', () => {
		it('should call console.error with bright red text and newline', () => {
			logger.error(text);

			expect(global.console.error).toBeCalledWith(`${colorette.redBright(text)}\n`);
		});

		it('should exit the process with code 1', () => {
			logger.error(text);

			expect(exit).toBeCalledWith(1);
		});
	});
});
