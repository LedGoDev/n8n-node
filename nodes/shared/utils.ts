import type { IDataObject } from 'n8n-workflow';

export type JsonParameterValue = IDataObject | IDataObject[];

export function parseJsonParameter(value: unknown): JsonParameterValue {
	const isNullOrUndefined = value === null || value === undefined;

	if (isNullOrUndefined) {
		return {};
	}

	const isString = typeof value === 'string';

	if (isString) {
		const hasContent = value.trim().length > 0;

		if (hasContent) {
			return JSON.parse(value) as JsonParameterValue;
		}

		return {};
	}

	return value as JsonParameterValue;
}

export function isParameterProvided(value: unknown): boolean {
	const isNullOrUndefined = value === null || value === undefined;

	if (isNullOrUndefined) {
		return false;
	}

	const isString = typeof value === 'string';

	if (isString) {
		return value.trim().length > 0;
	}

	const isObject = typeof value === 'object';

	if (isObject) {
		const objectValue = value as Record<string, unknown>;
		const hasKeys = Object.keys(objectValue).length > 0;

		return hasKeys;
	}

	return true;
}

export function extractFileNameFromPath(path: string): string {
	const segments = path.split('/');
	const lastSegment = segments[segments.length - 1] ?? '';
	const hasFileName = lastSegment.length > 0;

	if (!hasFileName) {
		return 'download';
	}

	return lastSegment;
}