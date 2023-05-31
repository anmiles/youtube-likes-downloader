declare global {
	namespace jest {
		interface Expect {
			function(args: any[], expectedReturnValue: any): any;
		}
	}
}

export {};
