import fs from 'fs';
import type { Interface } from 'readline';
import { createInterface } from 'readline';

import { mockPartial } from '@anmiles/jest-extensions';
import { error } from '@anmiles/logger';
import { validate } from '@anmiles/zod-tools';
import mockFs from 'mock-fs';
import z from 'zod';

import { addVideo } from '../addVideo';
import { getDownloadArchive, getOutputDir } from '../utils/paths';

import { SequentialArray } from './testUtils/sequentialArray';

jest.mock('@anmiles/logger');
jest.mock('readline');

jest.mock('colorette', () => new Proxy({}, {
	get: () => (str: string) => str,
}));

const profile         = 'username';
const videoFile       = 'test/video.mp4';
const imageFile       = 'test/poster.jpg';
const descriptionFile = 'test/description.txt';

const questions = [
	'Youtube link: ',
	'Channel: ',
	'Title: ',
	'Duration: ',
	'Resolution: ',
	'Video file: ',
	'Image file: ',
	'Description file: ',
] as const;

const questionsSchema = z.enum(questions);
const outputDir       = getOutputDir(profile);

const expectedFiles: Record<string, string> = {
	['output/username/First movie - beginning pilot version [Test channel].video_c3.mp4']        : 'video',
	['output/username/First movie - beginning pilot version [Test channel].video_c3.jpg']        : 'image',
	['output/username/First movie - beginning pilot version [Test channel].video_c3.description']: 'description',
	['output/username/First movie - beginning pilot version [Test channel].video_c3.info.json']  : JSON.stringify({
		id             : 'video_c3',
		title          : 'First movie: beginning <pilot version>',
		channel        : 'Test channel',
		ext            : 'mp4',
		width          : 1280,
		height         : 720,
		resolution     : '1280x720',
		duration_string: '01:30:00', // eslint-disable-line camelcase
	}),
};

let answers: Record<typeof questions[number], SequentialArray<string>>;

const readlineInterface = mockPartial<Interface>({
	question: jest.fn().mockImplementation((question: string, resolve: (answer: string)=> void) => {
		const validQuestion = validate(question, questionsSchema);
		const answer        = answers[validQuestion].next();

		if (typeof answer === 'undefined') {
			throw new Error(`Question '${question}' has no more answers`);
		}

		resolve(answer);
	}),

	close: jest.fn(),
});

jest.mocked(createInterface).mockReturnValue(readlineInterface);

beforeEach(() => {
	mockFs({
		[videoFile]                  : 'video',
		[imageFile]                  : 'image',
		[descriptionFile]            : 'description',
		[getDownloadArchive(profile)]: 'youtube video_a1\nyoutube video_b2\n',
	});

	answers = {
		'Youtube link: '    : new SequentialArray([ 'https://www.youtube.com/watch?v=video_c3' ]),
		'Channel: '         : new SequentialArray([ 'Test channel' ]),
		'Title: '           : new SequentialArray([ 'First movie: beginning <pilot version>' ]),
		'Duration: '        : new SequentialArray([ '01:30:00' ]),
		'Resolution: '      : new SequentialArray([ '1280x720' ]),
		'Video file: '      : new SequentialArray([ videoFile ]),
		'Image file: '      : new SequentialArray([ imageFile ]),
		'Description file: ': new SequentialArray([ descriptionFile ]),
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

		it('should output error if youtube link is not valid', async () => {
			answers['Youtube link: '] = new SequentialArray([ 'wrong link', 'https://www.youtube.com/watch?v=video_c3' ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('Youtube link should be in the format https://www.youtube.com/watch?v=...'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if duration is not valid', async () => {
			answers['Duration: '] = new SequentialArray([ 'wrong duration', '01:30:00' ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('Duration should be in the format <min>:<sec> or <hour>:<min>:<sec>'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if resolution is not valid', async () => {
			answers['Resolution: '] = new SequentialArray([ 'wrong resolution', '1280x720' ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('Resolution should be in the format <width>x<height>'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if video file does not exist', async () => {
			answers['Video file: '] = new SequentialArray([ 'wrong file', videoFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('File not exists'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if image file does not exist', async () => {
			answers['Image file: '] = new SequentialArray([ 'wrong file', imageFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('File not exists'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});

		it('should output error if description file does not exist', async () => {
			answers['Description file: '] = new SequentialArray([ 'wrong file', descriptionFile ]);

			await addVideo(profile);

			expect(error).toHaveBeenCalledWith(new Error('File not exists'));
			expect(outputDir).toMatchFiles(expectedFiles);
		});
	});
});
