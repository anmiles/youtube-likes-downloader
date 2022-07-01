export { sleep };
export default { sleep };

async function sleep(milliSeconds: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliSeconds);
	});
}
