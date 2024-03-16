import { error } from '@anmiles/logger';
import { run, check } from './lib/app';

run(process.argv[2]).then(() => {
	check(process.argv[2]);
}).catch((ex) => {
	error(ex);
	process.exit(1);
});
