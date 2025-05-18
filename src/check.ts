/* istanbul ignore file */

import { error } from '@anmiles/logger';

import { check } from './lib/app';

try {
	check(process.argv[2]);
} catch (ex) {
	error(ex);
	process.exit(1);
}
