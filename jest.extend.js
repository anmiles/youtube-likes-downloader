expect.extend({
	function(func, args, expectedReturnValue) {
		const actualReturnValue = func(...args);

		if (actualReturnValue === expectedReturnValue) {
			return {
				pass    : true,
				message : () => `Expected function not to return ${expectedReturnValue} but it did`,
			};
		}
		return {
			pass    : false,
			message : () => `Expected function not return ${expectedReturnValue} but it returned ${actualReturnValue}`,
		};
	},
});
