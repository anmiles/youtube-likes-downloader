import sleep from '../sleep';

const sleepMilliseconds = 300;

describe('src/lib/sleep', () => {
	describe('sleep', () => {

		it('should wait specified timeout', async () => {
			const before = new Date().getTime();

			await sleep.sleep(sleepMilliseconds);

			const after = new Date().getTime();
			expect(after - before).toBeGreaterThanOrEqual(sleepMilliseconds - 1);
		});
	});
});
