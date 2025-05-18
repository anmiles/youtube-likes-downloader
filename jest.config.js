module.exports = {
	preset   : 'ts-jest',
	transform: {
		'^.+\\.tsx?$': [ 'ts-jest', {
			tsconfig: './tsconfig.test.json',
		} ],
	},

	clearMocks: true,

	roots    : [ '<rootDir>/src' ],
	testMatch: [ '<rootDir>/src/**/__tests__/*.test.{ts,tsx}' ],

	collectCoverageFrom: [
		'<rootDir>/src/**/*.{ts,tsx}',
		'!<rootDir>/src/**/__tests__/**',
		'!<rootDir>/src/**/__mocks__/**',
	],
};
