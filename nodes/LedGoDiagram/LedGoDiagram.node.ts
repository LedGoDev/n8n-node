import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { ledgoApiRequest } from '../shared/transport';
import { isParameterProvided } from '../shared/utils';

export class LedGoDiagram implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Diagram',
		name: 'ledgoDiagram',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo Mermaid.js diagrams',
		defaults: {
			name: 'LedGo Diagram',
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
						name: 'Create Diagram',
						value: 'createDiagram',
						description: 'Create a new diagram with Mermaid.js code',
						action: 'Create a new diagram with mermaid js code',
					},
					{
						name: 'Delete Diagram',
						value: 'deleteDiagram',
						description: 'Delete a diagram',
						action: 'Delete a diagram',
					},
					{
						name: 'Get Diagram',
						value: 'getDiagram',
						description: 'Get a single diagram by its ID',
						action: 'Get a single diagram by its ID',
					},
					{
						name: 'List Diagrams',
						value: 'listDiagrams',
						description: 'List all diagrams for the organization',
						action: 'List all diagrams for the organization',
					},
					{
						name: 'Update Diagram',
						value: 'updateDiagram',
						description: 'Update the name, description, or code of a diagram',
						action: 'Update the name description or code of a diagram',
					},
				],
				default: 'listDiagrams',
			},
			{
				displayName: 'Diagram ID',
				name: 'diagramId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the diagram',
				displayOptions: {
					show: {
						operation: ['getDiagram', 'updateDiagram', 'deleteDiagram'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'Display name of the diagram',
				displayOptions: {
					show: {
						operation: ['createDiagram', 'updateDiagram'],
					},
				},
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				typeOptions: {
					rows: 8,
				},
				default: '',
				required: true,
				description: 'The Mermaid.js diagram definition code',
				displayOptions: {
					show: {
						operation: ['createDiagram', 'updateDiagram'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Optional description of the diagram purpose',
				displayOptions: {
					show: {
						operation: ['createDiagram', 'updateDiagram'],
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
			case 'listDiagrams':
				return ledgoApiRequest.call(this, 'GET', '/diagrams');

			case 'getDiagram': {
				const diagramId = this.getNodeParameter('diagramId', itemIndex, '') as string;

				return ledgoApiRequest.call(this, 'GET', `/diagrams/${diagramId}`);
			}

			case 'createDiagram': {
				const name = this.getNodeParameter('name', itemIndex, '') as string;
				const code = this.getNodeParameter('code', itemIndex, '') as string;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				const body: IDataObject = { name, code };
				const hasDescription = isParameterProvided(description);

				if (hasDescription) {
					body.description = description;
				}

				return ledgoApiRequest.call(this, 'POST', '/diagrams', body);
			}

			case 'updateDiagram': {
				const diagramId = this.getNodeParameter('diagramId', itemIndex, '') as string;
				const name = this.getNodeParameter('name', itemIndex, '') as string;
				const code = this.getNodeParameter('code', itemIndex, '') as string;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				const body: IDataObject = {};
				const hasName = isParameterProvided(name);
				const hasCode = isParameterProvided(code);
				const hasDescription = isParameterProvided(description);

				if (hasName) {
					body.name = name;
				}
				if (hasCode) {
					body.code = code;
				}
				if (hasDescription) {
					body.description = description;
				}

				return ledgoApiRequest.call(this, 'PATCH', `/diagrams/${diagramId}`, body);
			}

			case 'deleteDiagram': {
				const diagramId = this.getNodeParameter('diagramId', itemIndex, '') as string;

				await ledgoApiRequest.call(this, 'DELETE', `/diagrams/${diagramId}`);

				return { success: true };
			}

			default:
				throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
		}
}
