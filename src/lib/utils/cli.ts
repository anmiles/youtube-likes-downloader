import type { Interface } from 'readline';
import { createInterface } from 'readline';

import { error } from '@anmiles/logger';
import {  validate as zodValidate } from '@anmiles/zod-tools';
import type { Schema } from '@anmiles/zod-tools';
import * as colorette from 'colorette';

export class Cli {
	private readonly interface: Interface;

	constructor(
		private readonly transformInput = (text: string) => colorette.yellow(text),
	) {
		this.interface = createInterface({
			input : process.stdin,
			output: process.stdout,
		});
	}

	async getAnswer<T>(
		question: string,
		schema: Schema<T>,
		transformOutput?: (answer: string) => unknown,
	): Promise<T> {
		while (true) {
			const answer = await this.ask(`${question}: `);

			const output = answer
				? transformOutput
					? transformOutput(answer)
					: answer
				: undefined;

			try {
				return zodValidate(output, schema);
			} catch (ex) {
				const { message } = Error.parse(ex);
				error(message);
			}
		}
	}

	say(text: string): void {
		this.interface.write(`${this.transformInput(text)}\n`);
	}

	close(): void {
		this.interface.close();
	}

	private async ask(query: string): Promise<string> {
		return new Promise((resolve) => {
			this.interface.question(this.transformInput(query), resolve);
		});
	}
}
