import fs from 'fs';
import path from 'path';

import { log, warn } from '@anmiles/logger';

import type { VideoInfo } from './types';
import { formatTitle } from './utils/formatTitle';
import { getOutputDir } from './utils/paths';

export function validate(profile: string): void {
	const allFiles = {} as Record<string, { exts: string[]; newName: string | undefined }>;

	const outputDir = getOutputDir(profile);
	fs.ensureDir(outputDir, { create: true });

	fs.recurse(outputDir, {
		file: (filepath, filename) => {
			let { name, ext } = path.parse(filename);

			if (ext === '.json') {
				name = name.replace(/\.info$/, '');
				ext  = `.info${ext}`;
			}

			const file = allFiles[name] ??= { exts: [], newName: undefined };
			file.exts.push(ext);

			if (ext === '.info.json') {
				// TODO: zod
				// TODO: fs - replace readJSON "as" with zod validation
				const info   = fs.readJSON<VideoInfo>(filepath);
				file.newName = formatTitle(info).toFilename();
			}
		},
	}, { depth: 1 });

	Object.entries(allFiles).forEach(([ name, { exts, newName } ]) => {
		if (!newName) {
			throw new Error(`New name cannot be defined, probably ${name}.info.json does not exist`);
		}

		if (name !== newName) {
			warn('Rename');
			log(`\tOld name: ${name}`);
			log(`\tNew name: ${newName}`);

			for (const ext of exts) {
				const filename    = path.join(outputDir, name);
				const newFilename = path.join(outputDir, newName);
				fs.renameSync(filename + ext, newFilename + ext);
			}
		}
	});
}
