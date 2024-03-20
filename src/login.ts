/* istanbul ignore file */

import { error } from '@anmiles/logger';
import { login } from '@anmiles/google-api-wrapper';

login(process.argv[2])
	.catch((ex: unknown) => {
		error(ex);
		process.exit(1);
	});
