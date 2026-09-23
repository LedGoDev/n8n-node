module.exports = {
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
	},
	testRegex: '(/tests/.*\\.(test|spec))\\.ts$',
	collectCoverageFrom: ['nodes/**/*.ts', 'credentials/**/*.ts'],
};