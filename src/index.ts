/* istanbul ignore file */

import { error } from '@anmiles/logger';

import { check, run } from './lib/app';

run(process.argv[2])
	.then(() => {
		check(process.argv[2]);
	})
	.catch((ex: unknown) => {
		error(ex);
		process.exit(1);
	});
