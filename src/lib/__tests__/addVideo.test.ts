import fs from 'fs';
import type { Interface } from 'readline';
import { createInterface } from 'readline';

import { mockPartial } from '@anmiles/jest-extensions';
import { error } from '@anmiles/logger';
import { validate } from '@anmiles/zod-tools';
import mockFs from 'mock-fs';
import { open } from 'out-url';
import z from 'zod';

import { addVideo } from '../addVideo';
import { getDownloadArchive, getOutputDir } from '../utils/paths';

import { SequentialArray } from './testUtils/sequentialArray';

jest.mock('@anmiles/logger');
jest.mock('out-url');
jest.mock('readline');

jest.mock('colorette', () => new Proxy({}, {
	get: () => (str: string) => str,
}));

const profile         = 'username';
const videoFile       = 'test/video.mp4';
const imageFile       = 'test/poster.jpg';
const descriptionFile = 'test/description.txt';

const id   = 'video_c3';
const link = `https://www.youtube.com/watch?v=${id}`;

const title    = 'First movie: beginning <pilot version>';
const channel  = 'Test channel';
const duration = '01:30:00';

const width      = 1280;
const height     = 720;
const resolution = `${width}x${height}`;

const date  = '2020-01-01';
const epoch = Math.round(new Date(date).getTime() / 1000);

const ext = 'mp4';

const video       = 'video\nend';
const image       = 'image\nend';
const description = 'description\nend';

const thumbnail = 'https://example.com/maxresdefault.jpg?sqp=wveou-wwhriakkrft=&rs=qt';

const questions = [
	'Input JSON (optional): ',
	'Youtube link: ',
	'Title: ',
	'Channel: ',
	'Duration: ',
	'Resolution: ',
	'Date: ',
	'Video file: ',
	'Image file: ',
	'Description file: ',
] as const;

const questionsSchema = z.enum(questions);
const outputDir       = getOutputDir(profile);

const expectedFiles: Record<string, string> = {
	['output/username/First movie - beginning pilot version [Test channel].video_c3.mp4']        : video,
	['output/username/First movie - beginning pilot version [Test channel].video_c3.jpg']        : image,
	['output/username/First movie - beginning pilot version [Test channel].video_c3.description']: description,
	['output/username/First movie - beginning pilot version [Test channel].video_c3.info.json']  : JSON.stringify({
		id,
		title,
		channel,
		ext,
		width,
		height,
		resolution,
		duration_string: duration, // eslint-disable-line camelcase
		epoch,
	}),
};

let answers: Record<typeof questions[number], SequentialArray<string>>;

const write = jest.fn();
const close = jest.fn();

const readlineInterface = mockPartial<Interface>({
	question: jest.fn().mockImplementation((question: string, resolve: (answer: string) => void) => {
		let validQuestion: typeof questions[number];

		try {
			validQuestion = validate(question, questionsSchema);
		} catch (ex) {
			throw new Error(`Invalid question '${question}'`, Error.parse(ex));
		}

		const answer = answers[validQuestion].next();

		if (typeof answer === 'undefined') {
			throw new Error(`Question '${question}' has no more answers`);
		}

		resolve(answer);
	}),
	write,
	close,
});

jest.mocked(createInterface).mockReturnValue(readlineInterface);

beforeEach(() => {
	mockFs({
		[videoFile]                  : video,
		[imageFile]                  : image,
		[descriptionFile]            : description,
		[getDownloadArchive(profile)]: 'youtube video_a1\nyoutube video_b2\n',
	}, { createTmp: true });

	answers = {
		'Input JSON (optional): ': new SequentialArray([ '' ]),
		'Youtube link: '         : new SequentialArray([ link ]),
		'Title: '                : new SequentialArray([ title ]),
		'Channel: '              : new SequentialArray([ channel ]),
		'Duration: '             : new SequentialArray([ duration ]),
		'Resolution: '           : new SequentialArray([ resolution ]),
		'Date: '                 : new SequentialArray([ date ]),
		'Video file: '           : new SequentialArray([ videoFile ]),
		'Image file: '           : new SequentialArray([ imageFile ]),
		'Description file: '     : new SequentialArray([ descriptionFile ]),
	};
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/addVideo', () => {
	describe('addVideo', () => {
		it('should generate files', async () => {
			await addVideo(profile);

			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should add downloaded ID to the archive', async () => {
			await addVideo(profile);

			const downloadArchive = (await fs.promises.readFile(getDownloadArchive(profile))).toString();

			expect(downloadArchive).toEqual('youtube video_a1\nyoutube video_b2\nyoutube video_c3\n');
		});

		it('should close used interface', async () => {
			await addVideo(profile);

			expect(close).toHaveBeenCalled();
		});

		it('should output error if youtube link is not valid', async () => {
			answers['Youtube link: '] = new SequentialArray([ 'wrong link', link ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Youtube link should be in the format https://www.youtube.com/watch?v=...)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if duration is not valid', async () => {
			answers['Duration: '] = new SequentialArray([ 'wrong duration', duration ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Duration should be in the format <min>:<sec> or <hour>:<min>:<sec>)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if resolution is not valid', async () => {
			answers['Resolution: '] = new SequentialArray([ 'wrong resolution', resolution ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Resolution should be in the format <width>x<height>)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if date is not valid', async () => {
			answers['Date: '] = new SequentialArray([ 'wrong date', date ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Date should be in the format YYYY-MM-dd)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if video file does not exist', async () => {
			answers['Video file: '] = new SequentialArray([ 'wrong file', videoFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (File not exists)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if image file does not exist', async () => {
			answers['Image file: '] = new SequentialArray([ 'wrong file', imageFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (File not exists)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if description file does not exist', async () => {
			answers['Description file: '] = new SequentialArray([ 'wrong file', descriptionFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith('Validation failed:\n\t (File not exists)');
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		describe('json', () => {
			const json = Object.freeze({
				id,
				title,
				channel,
				duration,
				resolution,
				epoch,
				description,
				thumbnail,
			});

			it('should process json if specified', async () => {
				answers['Input JSON (optional): '] = new SequentialArray([ JSON.stringify(json) ]);

				await addVideo(profile);

				expect(outputDir).toMatchFiles(expectedFiles);
			});

			it('should open thumbnail in the browser', async () => {
				answers['Input JSON (optional): '] = new SequentialArray([ JSON.stringify(json) ]);

				await addVideo(profile);

				expect(open).toHaveBeenCalledWith('https://example.com/maxresdefault.jpg');
			});

			it('should output error if json is not valid', async () => {
				const wrongJSON = JSON.stringify({ ...json, resolution: 'wrong resolution' });

				answers['Input JSON (optional): '] = new SequentialArray([ JSON.stringify(wrongJSON), JSON.stringify(json) ]);

				await addVideo(profile);

				expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Invalid input)');
			});

			it('should output error if json is broken', async () => {
				const wrongJSON = 'wrong json';

				answers['Input JSON (optional): '] = new SequentialArray([ JSON.stringify(wrongJSON), JSON.stringify(json) ]);

				await addVideo(profile);

				expect(error).toHaveBeenCalledWith('Validation failed:\n\t (Invalid input)');
			});
		});
	});
});
