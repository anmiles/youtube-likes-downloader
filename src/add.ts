/* istanbul ignore file */

import { error } from '@anmiles/logger';

import { add } from './lib/app';

add(process.argv[2])
	.catch((ex: unknown) => {
		error(ex);
		process.exit(1);
	});
