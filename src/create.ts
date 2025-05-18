/* istanbul ignore file */

import { createProfile } from '@anmiles/google-api-wrapper';
import { error } from '@anmiles/logger';

try {
	createProfile(process.argv[2]);
} catch (ex: unknown) {
	error(ex);
	process.exit(1);
}
