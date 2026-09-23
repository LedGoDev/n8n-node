import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { ledgoApiRequest } from '../shared/transport';
import { isParameterProvided, parseJsonParameter } from '../shared/utils';

export class LedGoComment implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Comment',
		name: 'ledgoComment',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo comments anchored to databases and documents',
		defaults: {
			name: 'LedGo Comment',
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
						name: 'Create Database Comment',
						value: 'createDatabaseComment',
						description: 'Create a top-level comment or a reply anchored to a database target',
						action: 'Create a top level comment or a reply anchored to a database target',
					},
					{
						name: 'Create Document Comment',
						value: 'createDocumentComment',
						description: 'Create a top-level comment or a reply anchored to a document target',
						action: 'Create a top level comment or a reply anchored to a document target',
					},
					{
						name: 'Delete Comment',
						value: 'deleteComment',
						description: 'Delete an owned comment',
						action: 'Delete an owned comment',
					},
					{
						name: 'List Database Comments',
						value: 'listDatabaseComments',
						description: 'List the comments of a database, optionally filtered to one target',
						action: 'List the comments of a database optionally filtered to one target',
					},
					{
						name: 'List Document Comments',
						value: 'listDocumentComments',
						description: 'List the comments of a document, optionally filtered to one target',
						action: 'List the comments of a document optionally filtered to one target',
					},
					{
						name: 'Update Comment',
						value: 'updateComment',
						description: 'Update the body of an owned comment',
						action: 'Update the body of an owned comment',
					},
				],
				default: 'listDatabaseComments',
			},
			{
				displayName: 'Database ID',
				name: 'databaseId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the database the comments belong to',
				displayOptions: {
					show: {
						operation: ['listDatabaseComments', 'createDatabaseComment'],
					},
				},
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the document the comments belong to',
				displayOptions: {
					show: {
						operation: ['listDocumentComments', 'createDocumentComment'],
					},
				},
			},
			{
				displayName: 'Target Key',
				name: 'targetKey',
				type: 'string',
				default: '',
				description: 'Deterministic target key to filter a single element. Leave empty to list all comments.',
				displayOptions: {
					show: {
						operation: ['listDatabaseComments', 'listDocumentComments'],
					},
				},
			},
			{
				displayName: 'Target',
				name: 'target',
				type: 'json',
				default: '{}',
				required: true,
				description: 'Fine-grained target the comment is anchored to. Object with a kind property (database, column, record, cell, or block) and the required identifiers for that kind.',
				displayOptions: {
					show: {
						operation: ['createDatabaseComment', 'createDocumentComment'],
					},
				},
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				default: '',
				required: true,
				description: 'Text content of the comment',
				displayOptions: {
					show: {
						operation: ['createDatabaseComment', 'createDocumentComment', 'updateComment'],
					},
				},
			},
			{
				displayName: 'Parent ID',
				name: 'parentId',
				type: 'string',
				default: '',
				description: 'Parent comment ID to reply, empty for a top-level comment',
				displayOptions: {
					show: {
						operation: ['createDatabaseComment', 'createDocumentComment'],
					},
				},
			},
			{
				displayName: 'Comment ID',
				name: 'commentId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the comment',
				displayOptions: {
					show: {
						operation: ['updateComment', 'deleteComment'],
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
		case 'listDatabaseComments': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const targetKey = this.getNodeParameter('targetKey', itemIndex, '') as string;
			const qs: IDataObject = {};
			const hasTargetKey = isParameterProvided(targetKey);

			if (hasTargetKey) {
				qs.target_key = targetKey;
			}

			return ledgoApiRequest.call(this, 'GET', `/databases/${databaseId}/comments`, undefined, qs);
		}

		case 'createDatabaseComment': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const target = parseJsonParameter(this.getNodeParameter('target', itemIndex, '{}'));
			const body = this.getNodeParameter('body', itemIndex, '') as string;
			const parentId = this.getNodeParameter('parentId', itemIndex, '') as string;
			const payload: IDataObject = { target, body };
			const hasParentId = isParameterProvided(parentId);

			if (hasParentId) {
				payload.parent_id = parentId;
			}

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/comments`, payload);
		}

		case 'listDocumentComments': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const targetKey = this.getNodeParameter('targetKey', itemIndex, '') as string;
			const qs: IDataObject = {};
			const hasTargetKey = isParameterProvided(targetKey);

			if (hasTargetKey) {
				qs.target_key = targetKey;
			}

			return ledgoApiRequest.call(this, 'GET', `/documents/${documentId}/comments`, undefined, qs);
		}

		case 'createDocumentComment': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const target = parseJsonParameter(this.getNodeParameter('target', itemIndex, '{}'));
			const body = this.getNodeParameter('body', itemIndex, '') as string;
			const parentId = this.getNodeParameter('parentId', itemIndex, '') as string;
			const payload: IDataObject = { target, body };
			const hasParentId = isParameterProvided(parentId);

			if (hasParentId) {
				payload.parent_id = parentId;
			}

			return ledgoApiRequest.call(this, 'POST', `/documents/${documentId}/comments`, payload);
		}

		case 'updateComment': {
			const commentId = this.getNodeParameter('commentId', itemIndex, '') as string;
			const body = this.getNodeParameter('body', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'PATCH', `/databases/comments/${commentId}`, { body });
		}

		case 'deleteComment': {
			const commentId = this.getNodeParameter('commentId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/databases/comments/${commentId}`);

			return { success: true };
		}

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
	}
}