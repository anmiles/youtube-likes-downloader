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
	testMatch : [ '<rootDir>/src/**/__tests__/*.test.ts' ],

	collectCoverageFrom : [
		'<rootDir>/src/**/*.ts',
		'!<rootDir>/src/**/*.d.ts',
		'!<rootDir>/src/*.ts',
		'!<rootDir>/src/types/*.ts',

		'!**/node_modules/**',
		'!**/__tests__/**',

		'!<rootDir>/coverage/**',
		'!<rootDir>/dist/**',
		'!<rootDir>/input/**',
		'!<rootDir>/output/**',
		'!<rootDir>/secrets/**',
	],
};
