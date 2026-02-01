import type { Interface } from 'readline';
import { createInterface } from 'readline';

import { error } from '@anmiles/logger';
import * as colorette from 'colorette';

export class Cli {
	private readonly interface: Interface;

	constructor() {
		this.interface = createInterface({
			input : process.stdin,
			output: process.stdout,
		});
	}

	async getAnswer<T>(question: string, processAnswer: (answer: string) => T | Error): Promise<T> {
		while (true) {
			const answer = await this.ask(colorette.yellow(`${question}: `));
			const result = processAnswer(answer);

			if (!(result instanceof Error)) {
				return result;
			}

			error(result);
		}
	}

	close(): void {
		this.interface.close();
	}

	private async ask(query: string): Promise<string> {
		return new Promise((resolve) => {
			this.interface.question(query, resolve);
		});
	}
}
