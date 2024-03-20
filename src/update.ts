/* istanbul ignore file */

import { error } from '@anmiles/logger';
import { update } from './lib/app';

update(process.argv[2])
	.catch((ex: unknown) => {
		error(ex);
		process.exit(1);
	});
