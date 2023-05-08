import { error } from '@anmiles/logger';
import { run } from './lib/app';

run(process.argv[2]).catch((ex) => {
	error(ex);
	process.exit(1);
});
