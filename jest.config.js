module.exports = {
	preset    : 'ts-jest',
	transform : {
		'^.+\\.tsx?$' : [ 'ts-jest', {
			isolatedModules : true, // otherwise tests are slowing down a lot because of googleapis
			tsconfig        : './tsconfig.test.json',
		} ],
	},

	clearMocks : true,

	roots     : [ '<rootDir>/src' ],
	testMatch : [ '<rootDir>/src/**/__tests__/*.test.{ts,tsx}' ],

	collectCoverageFrom : [
		'<rootDir>/src/**/*.{ts,tsx}',
		'!<rootDir>/src/**/__tests__/**',
	],
};
