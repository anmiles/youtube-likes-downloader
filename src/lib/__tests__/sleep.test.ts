import sleep from '../sleep';

const sleepMilliseconds = 300;

describe('src/lib/sleep', () => {
	describe('sleep', () => {

		it('should call setTimeout', async () => {
			const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

			await sleep.sleep(sleepMilliseconds);

			expect(setTimeoutSpy.mock.calls[0][1]).toBe(sleepMilliseconds);
			setTimeoutSpy.mockRestore();
		});

		it('should wait specified timeout', async () => {
			const before = new Date().getTime();

			await sleep.sleep(sleepMilliseconds);

			const after = new Date().getTime();
			expect(after - before).toBeGreaterThanOrEqual(sleepMilliseconds - 1);
		});
	});
});
