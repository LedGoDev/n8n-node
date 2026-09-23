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
import { widgetsToContent, type IWidgetLike } from '../shared/widget-content';

export class LedGoDocument implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Document',
		name: 'ledgoDocument',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo project documents and their blocks',
		defaults: {
			name: 'LedGo Document',
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
						name: 'Create Block',
						value: 'createBlock',
						description: 'Create a new block inside a document',
						action: 'Create a new block inside a document',
					},
					{
						name: 'Create Blocks',
						value: 'createBlocks',
						description: 'Create several blocks inside a document with one gateway call',
						action: 'Create several blocks inside a document with one gateway call',
					},
					{
						name: 'Create Document',
						value: 'createDocument',
						description: 'Create a new document',
						action: 'Create a new document',
					},
					{
						name: 'Create Document With Blocks',
						value: 'createDocumentWithBlocks',
						description: 'Create a complete document with all its blocks in one call',
						action: 'Create a complete document with all its blocks in one call',
					},
					{
						name: 'Delete Block',
						value: 'deleteBlock',
						description: 'Delete a block from a document',
						action: 'Delete a block from a document',
					},
					{
						name: 'Delete Document',
						value: 'deleteDocument',
						description: 'Delete a document and all its blocks',
						action: 'Delete a document and all its blocks',
					},
					{
						name: 'Get Document',
						value: 'getDocument',
						description: 'Get a single document by its ID',
						action: 'Get a single document by its ID',
					},
					{
						name: 'List Blocks',
						value: 'listBlocks',
						description: 'List all blocks of a document',
						action: 'List all blocks of a document',
					},
					{
						name: 'List Documents',
						value: 'listDocuments',
						description: 'List all documents of the token-scoped project',
						action: 'List all documents of the token scoped project',
					},
					{
						name: 'Read Content',
						value: 'readContent',
						description: 'Read the content of a document as AI-readable text',
						action: 'Read the content of a document as AI readable text',
					},
					{
						name: 'Update Block',
						value: 'updateBlock',
						description: 'Update the widget type, config, or position of a block',
						action: 'Update the widget type config or position of a block',
					},
					{
						name: 'Update Block Positions',
						value: 'updateBlockPositions',
						description: 'Update the positions of several blocks with one gateway call',
						action: 'Update the positions of several blocks with one gateway call',
					},
					{
						name: 'Update Document',
						value: 'updateDocument',
						description: 'Update the properties of a document',
						action: 'Update the properties of a document',
					},
				],
				default: 'listDocuments',
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the document',
				displayOptions: {
					show: {
						operation: [
							'getDocument',
							'updateDocument',
							'deleteDocument',
							'listBlocks',
							'createBlock',
							'createBlocks',
							'updateBlock',
							'deleteBlock',
							'updateBlockPositions',
							'readContent',
						],
					},
				},
			},
			{
				displayName: 'Block ID',
				name: 'blockId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the block',
				displayOptions: {
					show: {
						operation: ['updateBlock', 'deleteBlock'],
					},
				},
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: 'Display title of the document',
				displayOptions: {
					show: {
						operation: ['createDocument', 'updateDocument', 'createDocumentWithBlocks'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Short summary shown in the documents list',
				displayOptions: {
					show: {
						operation: ['createDocument', 'updateDocument', 'createDocumentWithBlocks'],
					},
				},
			},
			{
				displayName: 'Orientation',
				name: 'orientation',
				type: 'options',
				default: 'portrait',
				options: [
					{
						name: 'Portrait',
						value: 'portrait',
						description: 'Vertical A4 sheet',
					},
					{
						name: 'Landscape',
						value: 'landscape',
						description: 'Horizontal A4 sheet',
					},
				],
				description: 'Orientation of the A4 sheet',
				displayOptions: {
					show: {
						operation: ['createDocument', 'updateDocument', 'createDocumentWithBlocks'],
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'published',
				options: [
					{
						name: 'Draft',
						value: 'draft',
						description: 'Not yet publicly visible',
					},
					{
						name: 'Published',
						value: 'published',
						description: 'Visible according to its scope',
					},
				],
				description: 'Publication status of the document',
				displayOptions: {
					show: {
						operation: ['createDocument', 'updateDocument', 'createDocumentWithBlocks'],
					},
				},
			},
			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				default: 'project',
				options: [
					{
						name: 'Public',
						value: 'public',
						description: 'Anyone with the document link can view it',
					},
					{
						name: 'Organization',
						value: 'organization',
						description: 'Only members of the owning organization can view it',
					},
					{
						name: 'Project',
						value: 'project',
						description: 'Only members of the owning project can view it',
					},
				],
				description: 'Sharing scope of the document',
				displayOptions: {
					show: {
						operation: ['createDocument', 'updateDocument', 'createDocumentWithBlocks'],
					},
				},
			},
			{
				displayName: 'Blocks',
				name: 'blocks',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Blocks created inside the document in the same transaction. Each entry has a widgetType, config, and position property. The title block is always full-width (w: 12).',
				displayOptions: {
					show: {
						operation: ['createDocumentWithBlocks', 'createBlocks'],
					},
				},
			},
			{
				displayName: 'Block',
				name: 'block',
				type: 'json',
				default: '{}',
				required: true,
				description: 'Block to create inside the document. Object with widgetType, config, and position properties.',
				displayOptions: {
					show: {
						operation: ['createBlock'],
					},
				},
			},
			{
				displayName: 'Block Update',
				name: 'blockUpdate',
				type: 'json',
				default: '{}',
				description: 'Block properties to update. Object with optional widgetType, config, and position properties.',
				displayOptions: {
					show: {
						operation: ['updateBlock'],
					},
				},
			},
			{
				displayName: 'Block Positions',
				name: 'blockPositions',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of position updates. Each entry has a blockId property and a position object with x, y, w, and h properties.',
				displayOptions: {
					show: {
						operation: ['updateBlockPositions'],
					},
				},
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'ai',
				options: [
					{
						name: 'AI',
						value: 'ai',
						description: 'Block ID followed by its Markdown inside a fenced code block',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Raw Markdown representation of each block',
					},
					{
						name: 'Plain',
						value: 'plain',
						description: 'Plain text representation of each block',
					},
				],
				description: 'Output format of the generated content',
				displayOptions: {
					show: {
						operation: ['readContent'],
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
		case 'listDocuments':
			return ledgoApiRequest.call(this, 'GET', '/documents');

		case 'getDocument': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/documents/${documentId}`);
		}

		case 'createDocument': {
			const title = this.getNodeParameter('title', itemIndex, '') as string;
			const description = this.getNodeParameter('description', itemIndex, '') as string;
			const orientation = this.getNodeParameter('orientation', itemIndex, 'portrait') as string;
			const status = this.getNodeParameter('status', itemIndex, 'published') as string;
			const scope = this.getNodeParameter('scope', itemIndex, 'project') as string;
			const body: IDataObject = { title, orientation, status, scope };
			const hasDescription = isParameterProvided(description);

			if (hasDescription) {
				body.description = description;
			}

			return ledgoApiRequest.call(this, 'POST', '/documents', body);
		}

		case 'createDocumentWithBlocks': {
			const title = this.getNodeParameter('title', itemIndex, '') as string;
			const description = this.getNodeParameter('description', itemIndex, '') as string;
			const orientation = this.getNodeParameter('orientation', itemIndex, 'portrait') as string;
			const status = this.getNodeParameter('status', itemIndex, 'published') as string;
			const scope = this.getNodeParameter('scope', itemIndex, 'project') as string;
			const blocks = parseJsonParameter(this.getNodeParameter('blocks', itemIndex, '[]'));
			const body: IDataObject = {
				title,
				orientation,
				status,
				scope,
				blocks: toBlockPayloads(blocks),
			};
			const hasDescription = isParameterProvided(description);

			if (hasDescription) {
				body.description = description;
			}

			return ledgoApiRequest.call(this, 'POST', '/documents', body);
		}

		case 'updateDocument': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const title = this.getNodeParameter('title', itemIndex, '') as string;
			const description = this.getNodeParameter('description', itemIndex, '') as string;
			const orientation = this.getNodeParameter('orientation', itemIndex, 'portrait') as string;
			const status = this.getNodeParameter('status', itemIndex, 'published') as string;
			const scope = this.getNodeParameter('scope', itemIndex, 'project') as string;
			const body: IDataObject = {};
			const hasTitle = isParameterProvided(title);
			const hasDescription = isParameterProvided(description);
			const hasOrientation = isParameterProvided(orientation);
			const hasStatus = isParameterProvided(status);
			const hasScope = isParameterProvided(scope);

			if (hasTitle) {
				body.title = title;
			}
			if (hasDescription) {
				body.description = description;
			}
			if (hasOrientation) {
				body.orientation = orientation;
			}
			if (hasStatus) {
				body.status = status;
			}
			if (hasScope) {
				body.scope = scope;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/documents/${documentId}`, body);
		}

		case 'deleteDocument': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/documents/${documentId}`);

			return { success: true };
		}

		case 'listBlocks': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/documents/${documentId}/blocks`);
		}

		case 'createBlock': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const block = parseJsonParameter(this.getNodeParameter('block', itemIndex, '{}'));
			const body = toBlockPayloads([block])[0] ?? {};

			return ledgoApiRequest.call(this, 'POST', `/documents/${documentId}/blocks`, body);
		}

		case 'createBlocks': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const blocks = parseJsonParameter(this.getNodeParameter('blocks', itemIndex, '[]'));
			const body: IDataObject = { blocks: toBlockPayloads(blocks) };

			return ledgoApiRequest.call(this, 'POST', `/documents/${documentId}/blocks/batch`, body);
		}

		case 'updateBlock': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const blockId = this.getNodeParameter('blockId', itemIndex, '') as string;
			const blockUpdate = parseJsonParameter(this.getNodeParameter('blockUpdate', itemIndex, '{}'));
			const update = blockUpdate as IDataObject;
			const body: IDataObject = {};

			if (update.widgetType !== undefined) {
				body.widget_type = update.widgetType;
			}
			if (update.config !== undefined) {
				body.config = update.config;
			}
			if (update.position !== undefined) {
				body.position = update.position;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/documents/${documentId}/blocks/${blockId}`, body);
		}

		case 'deleteBlock': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const blockId = this.getNodeParameter('blockId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/documents/${documentId}/blocks/${blockId}`);

			return { success: true };
		}

		case 'updateBlockPositions': {
			const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
			const blockPositions = parseJsonParameter(this.getNodeParameter('blockPositions', itemIndex, '[]'));
			const positionList = Array.isArray(blockPositions) ? blockPositions : [];
			const body: IDataObject = {
				positions: positionList.map((entry) => {
					const item = entry as IDataObject;

					return { id: item.blockId, position: item.position };
				}),
			};

			await ledgoApiRequest.call(this, 'PATCH', `/documents/${documentId}/blocks/positions`, body);

			return { success: true };
		}

case 'readContent': {
				const documentId = this.getNodeParameter('documentId', itemIndex, '') as string;
				const format = this.getNodeParameter('format', itemIndex, 'ai') as 'ai' | 'markdown' | 'plain';
				const response = await ledgoApiRequest.call(this, 'GET', `/documents/${documentId}/blocks`);
				const blocks = (Array.isArray(response) ? response : []) as unknown as IWidgetLike[];
				const content = widgetsToContent(blocks, format);

				return { content };
			}

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
	}
}

function toBlockPayloads(blocks: unknown): IDataObject[] {
	if (!Array.isArray(blocks)) {
		return [];
	}

	return blocks.map((block) => {
		const item = block as IDataObject;
		const result: IDataObject = { widget_type: item.widgetType };

		if (item.config !== undefined) {
			result.config = item.config;
		}
		if (item.position !== undefined) {
			result.position = item.position;
		}

		return result;
	});
}