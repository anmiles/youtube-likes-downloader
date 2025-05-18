/* istanbul ignore file */

import { login } from '@anmiles/google-api-wrapper';
import { error } from '@anmiles/logger';

login(process.argv[2])
	.catch((ex: unknown) => {
		error(ex);
		process.exit(1);
	});
