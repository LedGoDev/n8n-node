import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { MONDA_CREDENTIALS_TYPE, ledgoApiRequest } from '../shared/transport';
import { isParameterProvided, parseJsonParameter } from '../shared/utils';

export class LedGoForm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Form',
		name: 'ledgoForm',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo forms and their responses',
		defaults: {
			name: 'LedGo Form',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ledgoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Form',
						value: 'createForm',
						description: 'Create a new form with field definitions',
						action: 'Create a new form with field definitions',
					},
					{
						name: 'Delete Form',
						value: 'deleteForm',
						description: 'Delete a form and all its associated responses',
						action: 'Delete a form and all its associated responses',
					},
					{
						name: 'Get Form Session URL',
						value: 'getFormSessionUrl',
						description: 'Get the URL of the async form session endpoint used by external providers',
						action: 'Get the URL of the async form session endpoint used by external providers',
					},
					{
						name: 'List Forms',
						value: 'listForms',
						description: 'List all forms for the organization',
						action: 'List all forms for the organization',
					},
					{
						name: 'List Responses',
						value: 'listResponses',
						description: 'List all submissions for a specific form',
						action: 'List all submissions for a specific form',
					},
					{
						name: 'Update Form',
						value: 'updateForm',
						description: 'Update an existing form configuration',
						action: 'Update an existing form configuration',
					},
				],
				default: 'listForms',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '',
				description: 'Session token of the form session. When provided, the URL to read the session record is also returned.',
				displayOptions: {
					show: {
						operation: ['getFormSessionUrl'],
					},
				},
			},
			{
				displayName: 'Form ID',
				name: 'formId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the form',
				displayOptions: {
					show: {
						operation: ['updateForm', 'deleteForm', 'listResponses'],
					},
				},
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: 'Display title of the form',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				default: '',
				required: true,
				description: 'URL-friendly unique identifier of the form (e.g. feedback-form-2024)',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'options',
				default: 'public',
				options: [
					{
						name: 'Public',
						value: 'public',
						description: 'Anyone with the form link can submit',
					},
					{
						name: 'Private',
						value: 'private',
						description: 'Only authenticated organization members can submit',
					},
				],
				description: 'Access level controlling who can view and submit the form',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Longer description shown at the top of the form',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'json',
				default: '',
				description: 'Array of field definitions that constitute the form data structure. Each field requires ID, type, and title properties.',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'JSON Schema',
				name: 'jsonSchema',
				type: 'json',
				default: '',
				description: 'Optional JSON Schema for advanced server-side validation',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
			{
				displayName: 'UI Schema',
				name: 'uiSchema',
				type: 'json',
				default: '',
				description: 'Optional UI Schema for advanced rendering customization',
				displayOptions: {
					show: {
						operation: ['createForm', 'updateForm'],
					},
				},
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex, '') as string;
				const responseData = await processOperation.call(this, operation, itemIndex);
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: itemIndex } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
					continue;
				}

				throw new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnData];
	}
}

async function processOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
		switch (operation) {
			case 'listForms':
				return ledgoApiRequest.call(this, 'GET', '/forms');

			case 'getFormSessionUrl': {
				const sessionId = this.getNodeParameter('sessionId', itemIndex, '') as string;
				const url = await buildFormSessionUrl.call(this);
				const result: IDataObject = { url };
				const hasSessionId = isParameterProvided(sessionId);

				if (hasSessionId) {
					result.readUrl = `${url}?id=${encodeURIComponent(sessionId)}`;
				}

				return result;
			}

			case 'createForm': {
				const title = this.getNodeParameter('title', itemIndex, '') as string;
				const slug = this.getNodeParameter('slug', itemIndex, '') as string;
				const visibility = this.getNodeParameter('visibility', itemIndex, 'public') as string;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				const fields = parseJsonParameter(this.getNodeParameter('fields', itemIndex, ''));
				const jsonSchema = parseJsonParameter(this.getNodeParameter('jsonSchema', itemIndex, ''));
				const uiSchema = parseJsonParameter(this.getNodeParameter('uiSchema', itemIndex, ''));
				const body: IDataObject = { title, slug, visibility };
				const hasDescription = isParameterProvided(description);
				const hasFields = isParameterProvided(fields);
				const hasJsonSchema = isParameterProvided(jsonSchema);
				const hasUiSchema = isParameterProvided(uiSchema);

				if (hasDescription) {
					body.description = description;
				}
				if (hasFields) {
					body.fields = fields;
				}
				if (hasJsonSchema) {
					body.jsonSchema = jsonSchema;
				}
				if (hasUiSchema) {
					body.uiSchema = uiSchema;
				}

				return ledgoApiRequest.call(this, 'POST', '/forms', body);
			}

			case 'updateForm': {
				const formId = this.getNodeParameter('formId', itemIndex, '') as string;
				const title = this.getNodeParameter('title', itemIndex, '') as string;
				const slug = this.getNodeParameter('slug', itemIndex, '') as string;
				const visibility = this.getNodeParameter('visibility', itemIndex, 'public') as string;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				const fields = parseJsonParameter(this.getNodeParameter('fields', itemIndex, ''));
				const jsonSchema = parseJsonParameter(this.getNodeParameter('jsonSchema', itemIndex, ''));
				const uiSchema = parseJsonParameter(this.getNodeParameter('uiSchema', itemIndex, ''));
				const body: IDataObject = { visibility };
				const hasTitle = isParameterProvided(title);
				const hasSlug = isParameterProvided(slug);
				const hasDescription = isParameterProvided(description);
				const hasFields = isParameterProvided(fields);
				const hasJsonSchema = isParameterProvided(jsonSchema);
				const hasUiSchema = isParameterProvided(uiSchema);

				if (hasTitle) {
					body.title = title;
				}
				if (hasSlug) {
					body.slug = slug;
				}
				if (hasDescription) {
					body.description = description;
				}
				if (hasFields) {
					body.fields = fields;
				}
				if (hasJsonSchema) {
					body.jsonSchema = jsonSchema;
				}
				if (hasUiSchema) {
					body.uiSchema = uiSchema;
				}

				return ledgoApiRequest.call(this, 'PATCH', `/forms/${formId}`, body);
			}

			case 'deleteForm': {
				const formId = this.getNodeParameter('formId', itemIndex, '') as string;

				await ledgoApiRequest.call(this, 'DELETE', `/forms/${formId}`);

				return { success: true };
			}

			case 'listResponses': {
				const formId = this.getNodeParameter('formId', itemIndex, '') as string;

				return ledgoApiRequest.call(this, 'GET', `/forms/${formId}/responses`);
			}

			default:
				throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
		}
}

async function buildFormSessionUrl(this: IExecuteFunctions): Promise<string> {
	const credentials = (await this.getCredentials(MONDA_CREDENTIALS_TYPE)) as { baseUrl: string; organizationId?: string; };
	const { baseUrl, organizationId } = credentials;
	const apiBaseUrl = organizationId ? `${baseUrl}/organizations/${organizationId}` : baseUrl;
	const functionsBaseUrl = deriveFunctionsBaseUrl(apiBaseUrl);

	return functionsBaseUrl ? `${functionsBaseUrl}/form-session` : `${apiBaseUrl}/functions/form-session`;
}

function deriveFunctionsBaseUrl(apiBaseUrl: string): string | undefined {
	try {
		const { hostname } = new URL(apiBaseUrl);

		if (!hostname.endsWith('.insforge.app')) {
			return undefined;
		}

		const appKey = hostname.split('.')[0];

		return `https://${appKey}.function2.insforge.app`;
	} catch {
		return undefined;
	}
}
