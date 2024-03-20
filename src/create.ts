/* istanbul ignore file */

import { error } from '@anmiles/logger';
import { createProfile } from '@anmiles/google-api-wrapper';

try {
	createProfile(process.argv[2]);
} catch (ex: unknown) {
	error(ex);
	process.exit(1);
}
