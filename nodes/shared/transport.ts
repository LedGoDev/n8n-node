import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

export const MONDA_CREDENTIALS_TYPE = 'ledgoApi';

interface ILedGoApiCredentials {
	baseUrl: string;
	organizationId?: string;
	token: string;
}

export async function ledgoApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
) {
	const credentials = (await this.getCredentials(MONDA_CREDENTIALS_TYPE)) as unknown as ILedGoApiCredentials;
	const url = `${buildOrganizationBaseUrl(credentials)}${path}`;
	const options: IHttpRequestOptions = {
		method,
		url,
		json: true,
	};
	const hasBody = body !== undefined;
	const hasQuery = qs !== undefined;

	if (hasBody) {
		options.body = body;
	}
	if (hasQuery) {
		options.qs = qs;
	}

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		MONDA_CREDENTIALS_TYPE,
		options,
	);

	return response as IDataObject | IDataObject[];
}

export async function ledgoApiRequestFormData(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: FormData,
) {
	const credentials = (await this.getCredentials(MONDA_CREDENTIALS_TYPE)) as unknown as ILedGoApiCredentials;
	const url = `${buildOrganizationBaseUrl(credentials)}${path}`;
	const options: IHttpRequestOptions = {
		method,
		url,
		json: true,
	};
	const hasBody = body !== undefined;

	if (hasBody) {
		options.body = body;
	}

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		MONDA_CREDENTIALS_TYPE,
		options,
	);

	return response as IDataObject | IDataObject[];
}

export async function ledgoApiRequestBinary(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: FormData,
) {
	const credentials = (await this.getCredentials(MONDA_CREDENTIALS_TYPE)) as unknown as ILedGoApiCredentials;
	const url = `${buildOrganizationBaseUrl(credentials)}${path}`;
	const options: IHttpRequestOptions = {
		method,
		url,
		json: false,
		encoding: 'arraybuffer',
	};
	const hasBody = body !== undefined;

	if (hasBody) {
		options.body = body;
	}

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		MONDA_CREDENTIALS_TYPE,
		options,
	);

	return response as Buffer;
}

export async function ledgoApiPublicRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
) {
	const credentials = (await this.getCredentials(MONDA_CREDENTIALS_TYPE)) as unknown as ILedGoApiCredentials;
	const { baseUrl } = credentials;
	const url = `${baseUrl}${path}`;
	const options: IHttpRequestOptions = {
		method,
		url,
		json: true,
	};
	const hasBody = body !== undefined;
	const hasQuery = qs !== undefined;

	if (hasBody) {
		options.body = body;
	}
	if (hasQuery) {
		options.qs = qs;
	}

	const response = await this.helpers.httpRequest.call(this, options);

	return response as IDataObject | IDataObject[];
}

function buildOrganizationBaseUrl(credentials: ILedGoApiCredentials): string {
	const { baseUrl, organizationId } = credentials;

	if (organizationId) {
		return `${baseUrl}/organizations/${organizationId}`;
	}

	return baseUrl;
}