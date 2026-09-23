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

export class LedgoDatabase implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Database',
		name: 'ledgoDatabase',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo custom databases and their records',
		defaults: {
			name: 'LedGo Database',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Database',
						value: 'database',
					},
					{
						name: 'Record',
						value: 'record',
					},
				],
				default: 'database',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Aggregate Records',
						value: 'aggregateRecords',
						description: 'Run an aggregation (count, sum, avg, min, max) over record data fields',
						action: 'Run an aggregation count sum avg min max over record data fields',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Batch Records',
						value: 'batchRecords',
						description: 'Execute a batch of record operations with one gateway call',
						action: 'Execute a batch of record operations with one gateway call',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Count Records',
						value: 'countRecords',
						description: 'Count records matching the provided filters',
						action: 'Count records matching the provided filters',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Create Database',
						value: 'createDatabase',
						description: 'Create a new custom database structure with an optional schema',
						action: 'Create a new custom database structure with an optional schema',
						displayOptions: {
							show: {
								resource: ['database'],
							},
						},
					},
					{
						name: 'Create Record',
						value: 'createRecord',
						description: 'Create a new record in a database',
						action: 'Create a new record in a database',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Create Records',
						value: 'createRecords',
						description: 'Insert several records with one gateway call',
						action: 'Insert several records with one gateway call',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Delete Database',
						value: 'deleteDatabase',
						description: 'Delete a database and all its records',
						action: 'Delete a database and all its records',
						displayOptions: {
							show: {
								resource: ['database'],
							},
						},
					},
					{
						name: 'Delete Record',
						value: 'deleteRecord',
						description: 'Delete a record from a database',
						action: 'Delete a record from a database',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Delete Records',
						value: 'deleteRecords',
						description: 'Delete several records with one gateway call',
						action: 'Delete several records with one gateway call',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'List Databases',
						value: 'listDatabases',
						description: 'List all custom databases for the organization',
						action: 'List all custom databases for the organization',
						displayOptions: {
							show: {
								resource: ['database'],
							},
						},
					},
					{
						name: 'List Records',
						value: 'listRecords',
						description: 'List all records within a database',
						action: 'List all records within a database',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Query Records',
						value: 'queryRecords',
						description: 'Run a server-side query with filters, sorting, and pagination',
						action: 'Run a server side query with filters sorting and pagination',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Update Database',
						value: 'updateDatabase',
						description: 'Update the name, description, or schemas of a database',
						action: 'Update the name description or schemas of a database',
						displayOptions: {
							show: {
								resource: ['database'],
							},
						},
					},
					{
						name: 'Update Record',
						value: 'updateRecord',
						description: 'Update an existing database record with new data',
						action: 'Update an existing database record with new data',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Update Records',
						value: 'updateRecords',
						description: 'Update several records with one gateway call',
						action: 'Update several records with one gateway call',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
					{
						name: 'Upsert Records',
						value: 'upsertRecords',
						description: 'Insert or update several records with one gateway call',
						action: 'Insert or update several records with one gateway call',
						displayOptions: {
							show: {
								resource: ['record'],
							},
						},
					},
				],
				default: 'listDatabases',
			},
			{
				displayName: 'Database ID',
				name: 'databaseId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the database',
				displayOptions: {
					show: {
						resource: ['database', 'record'],
						operation: [
							'updateDatabase',
							'deleteDatabase',
							'listRecords',
							'createRecord',
							'updateRecord',
							'deleteRecord',
							'queryRecords',
							'countRecords',
							'aggregateRecords',
							'batchRecords',
							'createRecords',
							'updateRecords',
							'upsertRecords',
							'deleteRecords',
						],
					},
				},
			},
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the record',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['updateRecord', 'deleteRecord'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'Display name of the database',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['createDatabase', 'updateDatabase'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Optional description of the database purpose and contents',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['createDatabase', 'updateDatabase'],
					},
				},
			},
			{
				displayName: 'Schema',
				name: 'schema',
				type: 'json',
				default: '',
				description: 'JSON Schema describing the expected structure of records',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['createDatabase', 'updateDatabase'],
					},
				},
			},
			{
				displayName: 'UI Schema',
				name: 'uiSchema',
				type: 'json',
				default: '',
				description: 'UI Schema describing layout and presentation rules for the record editor',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['createDatabase', 'updateDatabase'],
					},
				},
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '{}',
				required: true,
				description: 'Record data. Structure must conform to the parent database schema.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['createRecord', 'updateRecord'],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '',
				description: 'Array of server-side filters. Each filter has field, op, and value properties. Supported ops: eq, neq, contains, starts_with, gt, gte, lt, lte, in, between, is_null, is_not_null.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['queryRecords', 'countRecords', 'aggregateRecords'],
					},
				},
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'json',
				default: '',
				description: 'Array of sort entries. Each entry has a field property and an optional dir property (asc or desc).',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['queryRecords'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['queryRecords'],
					},
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of records to skip before returning results',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['queryRecords'],
					},
				},
			},
			{
				displayName: 'Aggregate',
				name: 'aggregate',
				type: 'json',
				default: '{}',
				required: true,
				description: 'Aggregation specification. Has an op property (count, sum, avg, min, max), an optional field property, and an optional groupBy property.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['aggregateRecords'],
					},
				},
			},
			{
				displayName: 'Create Records',
				name: 'create',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of raw data objects to insert as new records',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['batchRecords'],
					},
				},
			},
			{
				displayName: 'Update Records',
				name: 'update',
				type: 'json',
				default: '[]',
				description: 'Array of updates to apply to existing records. Each entry has an ID and a data property.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['batchRecords'],
					},
				},
			},
			{
				displayName: 'Upsert Records',
				name: 'upsert',
				type: 'json',
				default: '[]',
				description: 'Array of upserts applied by ID when present, inserted otherwise. Each entry has a data property and an optional ID property.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['batchRecords'],
					},
				},
			},
			{
				displayName: 'Delete Record IDs',
				name: 'deleteIds',
				type: 'json',
				default: '[]',
				description: 'Array of record identifiers to remove by the batch',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['batchRecords'],
					},
				},
			},
			{
				displayName: 'Records',
				name: 'records',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of raw data objects to insert as new records',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['createRecords'],
					},
				},
			},
			{
				displayName: 'Updates',
				name: 'updates',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of updates to apply to existing records. Each entry has an ID and a data property.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['updateRecords'],
					},
				},
			},
			{
				displayName: 'Upserts',
				name: 'upserts',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of upserts applied by ID when present, inserted otherwise. Each entry has a data property and an optional ID property.',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['upsertRecords'],
					},
				},
			},
			{
				displayName: 'Record IDs',
				name: 'recordIds',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of record identifiers to delete',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['deleteRecords'],
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
		case 'listDatabases':
			return ledgoApiRequest.call(this, 'GET', '/databases');

		case 'createDatabase': {
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const description = this.getNodeParameter('description', itemIndex, '') as string;
			const schema = parseJsonParameter(this.getNodeParameter('schema', itemIndex, ''));
			const uiSchema = parseJsonParameter(this.getNodeParameter('uiSchema', itemIndex, ''));
			const body: IDataObject = { name };
			const hasDescription = isParameterProvided(description);
			const hasSchema = isParameterProvided(schema);
			const hasUiSchema = isParameterProvided(uiSchema);

			if (hasDescription) {
				body.description = description;
			}
			if (hasSchema) {
				body.schema = schema;
			}
			if (hasUiSchema) {
				body.uiSchema = uiSchema;
			}

			return ledgoApiRequest.call(this, 'POST', '/databases', body);
		}

		case 'updateDatabase': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const description = this.getNodeParameter('description', itemIndex, '') as string;
			const schema = parseJsonParameter(this.getNodeParameter('schema', itemIndex, ''));
			const uiSchema = parseJsonParameter(this.getNodeParameter('uiSchema', itemIndex, ''));
			const body: IDataObject = {};
			const hasName = isParameterProvided(name);
			const hasDescription = isParameterProvided(description);
			const hasSchema = isParameterProvided(schema);
			const hasUiSchema = isParameterProvided(uiSchema);

			if (hasName) {
				body.name = name;
			}
			if (hasDescription) {
				body.description = description;
			}
			if (hasSchema) {
				body.schema = schema;
			}
			if (hasUiSchema) {
				body.uiSchema = uiSchema;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/databases/${databaseId}`, body);
		}

		case 'deleteDatabase': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/databases/${databaseId}`);

			return { success: true };
		}

		case 'listRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/databases/${databaseId}/records`);
		}

		case 'createRecord': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const data = parseJsonParameter(this.getNodeParameter('data', itemIndex, '{}'));
			const body: IDataObject = { data };

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/records`, body);
		}

		case 'updateRecord': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const recordId = this.getNodeParameter('recordId', itemIndex, '') as string;
			const data = parseJsonParameter(this.getNodeParameter('data', itemIndex, '{}'));
			const body: IDataObject = { data };

			return ledgoApiRequest.call(this, 'PATCH', `/databases/${databaseId}/records/${recordId}`, body);
		}

		case 'deleteRecord': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const recordId = this.getNodeParameter('recordId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/databases/${databaseId}/records/${recordId}`);

			return { success: true };
		}

		case 'queryRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const filters = parseJsonParameter(this.getNodeParameter('filters', itemIndex, ''));
			const sort = parseJsonParameter(this.getNodeParameter('sort', itemIndex, ''));
			const limit = this.getNodeParameter('limit', itemIndex, 100) as number;
			const offset = this.getNodeParameter('offset', itemIndex, 0) as number;
			const qs: IDataObject = { limit, offset };
			const hasFilters = isParameterProvided(filters);
			const hasSort = isParameterProvided(sort);

			if (hasFilters) {
				qs.filter = JSON.stringify(filters);
			}
			if (hasSort) {
				qs.sort = JSON.stringify(sort);
			}

			return ledgoApiRequest.call(this, 'GET', `/databases/${databaseId}/records`, undefined, qs);
		}

		case 'countRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const filters = parseJsonParameter(this.getNodeParameter('filters', itemIndex, ''));
			const qs: IDataObject = { aggregate: JSON.stringify({ op: 'count' }) };
			const hasFilters = isParameterProvided(filters);

			if (hasFilters) {
				qs.filter = JSON.stringify(filters);
			}

			return ledgoApiRequest.call(this, 'GET', `/databases/${databaseId}/records`, undefined, qs);
		}

		case 'aggregateRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const aggregate = parseJsonParameter(this.getNodeParameter('aggregate', itemIndex, '{}'));
			const filters = parseJsonParameter(this.getNodeParameter('filters', itemIndex, ''));
			const qs: IDataObject = { aggregate: JSON.stringify(aggregate) };
			const hasFilters = isParameterProvided(filters);

			if (hasFilters) {
				qs.filter = JSON.stringify(filters);
			}

			return ledgoApiRequest.call(this, 'GET', `/databases/${databaseId}/records`, undefined, qs);
		}

		case 'batchRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const create = parseJsonParameter(this.getNodeParameter('create', itemIndex, '[]'));
			const update = parseJsonParameter(this.getNodeParameter('update', itemIndex, '[]'));
			const upsert = parseJsonParameter(this.getNodeParameter('upsert', itemIndex, '[]'));
			const deleteIds = parseJsonParameter(this.getNodeParameter('deleteIds', itemIndex, '[]'));
			const body: IDataObject = {
				create: Array.isArray(create) ? create : [],
				update: Array.isArray(update) ? update : [],
				upsert: Array.isArray(upsert) ? upsert : [],
				delete_ids: Array.isArray(deleteIds) ? deleteIds : [],
			};

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/records/batch`, body);
		}

		case 'createRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const records = parseJsonParameter(this.getNodeParameter('records', itemIndex, '[]'));
			const body: IDataObject = { create: Array.isArray(records) ? records : [] };

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/records/batch`, body);
		}

		case 'updateRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const updates = parseJsonParameter(this.getNodeParameter('updates', itemIndex, '[]'));
			const body: IDataObject = { update: Array.isArray(updates) ? updates : [] };

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/records/batch`, body);
		}

		case 'upsertRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const upserts = parseJsonParameter(this.getNodeParameter('upserts', itemIndex, '[]'));
			const body: IDataObject = { upsert: Array.isArray(upserts) ? upserts : [] };

			return ledgoApiRequest.call(this, 'POST', `/databases/${databaseId}/records/batch`, body);
		}

		case 'deleteRecords': {
			const databaseId = this.getNodeParameter('databaseId', itemIndex, '') as string;
			const recordIds = parseJsonParameter(this.getNodeParameter('recordIds', itemIndex, '[]'));
			const body: IDataObject = { ids: Array.isArray(recordIds) ? recordIds : [] };

			await ledgoApiRequest.call(this, 'DELETE', `/databases/${databaseId}/records/batch`, body);

			return { success: true };
		}

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
	}
}