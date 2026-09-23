import { extractFileNameFromPath, isParameterProvided, parseJsonParameter } from '../../nodes/shared/utils';

describe('parseJsonParameter', () => {
	it('returns an empty object when the value is null', () => {
		const result = parseJsonParameter(null);

		expect(result).toEqual({});
	});

	it('returns an empty object when the value is undefined', () => {
		const result = parseJsonParameter(undefined);

		expect(result).toEqual({});
	});

	it('returns an empty object when the string is empty', () => {
		const result = parseJsonParameter('');

		expect(result).toEqual({});
	});

	it('returns an empty object when the string only has whitespace', () => {
		const result = parseJsonParameter('   ');

		expect(result).toEqual({});
	});

	it('parses a JSON string into an object', () => {
		const result = parseJsonParameter('{"name":"LedGo"}');

		expect(result).toEqual({ name: 'LedGo' });
	});

	it('parses a JSON string into an array', () => {
		const result = parseJsonParameter('[{"id":"title","type":"string"}]');

		expect(result).toEqual([{ id: 'title', type: 'string' }]);
	});

	it('returns the value as-is when it is already an object', () => {
		const value = { name: 'LedGo' };
		const result = parseJsonParameter(value);

		expect(result).toBe(value);
	});
});

describe('isParameterProvided', () => {
	it('returns false for null', () => {
		const result = isParameterProvided(null);

		expect(result).toBe(false);
	});

	it('returns false for undefined', () => {
		const result = isParameterProvided(undefined);

		expect(result).toBe(false);
	});

	it('returns false for an empty string', () => {
		const result = isParameterProvided('');

		expect(result).toBe(false);
	});

	it('returns false for an empty object', () => {
		const result = isParameterProvided({});

		expect(result).toBe(false);
	});

	it('returns false for an empty array', () => {
		const result = isParameterProvided([]);

		expect(result).toBe(false);
	});

	it('returns true for a non-empty string', () => {
		const result = isParameterProvided('Sprint Board');

		expect(result).toBe(true);
	});

	it('returns true for an object with keys', () => {
		const result = isParameterProvided({ title: 'Fix bug' });

		expect(result).toBe(true);
	});

	it('returns true for an array with items', () => {
		const result = isParameterProvided([{ id: 'title' }]);

		expect(result).toBe(true);
	});

	it('returns true for numbers and booleans', () => {
		expect(isParameterProvided(0)).toBe(true);
		expect(isParameterProvided(false)).toBe(true);
	});
});

describe('extractFileNameFromPath', () => {
	it('returns the last path segment', () => {
		const result = extractFileNameFromPath('reports/summary.txt');

		expect(result).toBe('summary.txt');
	});

	it('returns the segment when the path has a single segment', () => {
		const result = extractFileNameFromPath('avatar.png');

		expect(result).toBe('avatar.png');
	});

	it('returns download when the path ends with a separator', () => {
		const result = extractFileNameFromPath('reports/');

		expect(result).toBe('download');
	});

	it('returns download when the path is empty', () => {
		const result = extractFileNameFromPath('');

		expect(result).toBe('download');
	});
});