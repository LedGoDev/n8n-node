import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { ledgoApiPublicRequest, ledgoApiRequest } from '../shared/transport';
import { isParameterProvided, parseJsonParameter } from '../shared/utils';

export class LedGoKanban implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Kanban',
		name: 'ledgoKanban',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo kanban dashboards, columns, panels, and cards',
		defaults: {
			name: 'LedGo Kanban',
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
						name: 'Create Access Link',
						value: 'createAccessLink',
						description: 'Mint a signed access link for a blueprint dashboard',
						action: 'Mint a signed access link for a blueprint dashboard',
					},
					{
						name: 'Create Blueprint',
						value: 'createBlueprint',
						description: 'Create a blueprint dashboard rendered from an external provider',
						action: 'Create a blueprint dashboard rendered from an external provider',
					},
					{
						name: 'Create Card',
						value: 'createCard',
						description: 'Create a new card within a column',
						action: 'Create a new card within a column',
					},
					{
						name: 'Create Column',
						value: 'createColumn',
						description: 'Create a new column within a dashboard',
						action: 'Create a new column within a dashboard',
					},
					{
						name: 'Create Dashboard',
						value: 'createDashboard',
						description: 'Create a new kanban dashboard with an optional card template',
						action: 'Create a new kanban dashboard with an optional card template',
					},
					{
						name: 'Create Panel',
						value: 'createPanel',
						description: 'Create a new panel within a column',
						action: 'Create a new panel within a column',
					},
					{
						name: 'Delete Dashboard',
						value: 'deleteDashboard',
						description: 'Delete a dashboard and all its columns, panels, and cards',
						action: 'Delete a dashboard and all its columns panels and cards',
					},
					{
						name: 'Delete Item',
						value: 'deleteItem',
						description: 'Delete a column, panel, or card by its ID and type',
						action: 'Delete a column panel or card by its id and type',
					},
					{
						name: 'Get Item',
						value: 'getItem',
						description: 'Get a single column, panel, or card by its ID',
						action: 'Get a single column panel or card by its id',
					},
					{
						name: 'Get Public Board',
						value: 'getPublicBoard',
						description: 'Read a public blueprint board through its public route',
						action: 'Read a public blueprint board through its public route',
					},
					{
						name: 'Get Public Config',
						value: 'getPublicConfig',
						description: 'Read the server-only public configuration of a blueprint',
						action: 'Read the server only public configuration of a blueprint',
					},
					{
						name: 'List Access Links',
						value: 'listAccessLinks',
						description: 'List the signed access links minted for a dashboard',
						action: 'List the signed access links minted for a dashboard',
					},
					{
						name: 'List Dashboards',
						value: 'listDashboards',
						description: 'List all kanban dashboards for the organization',
						action: 'List all kanban dashboards for the organization',
					},
					{
						name: 'List Items',
						value: 'listItems',
						description: 'List all columns, panels, and cards within a dashboard',
						action: 'List all columns panels and cards within a dashboard',
					},
					{
						name: 'Move Card (Public)',
						value: 'movePublicCard',
						description: 'Move a card through a public signed link with edit scope',
						action: 'Move a card through a public signed link with edit scope',
					},
					{
						name: 'Move Item',
						value: 'moveItem',
						description: 'Move an item to a new container or change its position',
						action: 'Move an item to a new container or change its position',
					},
					{
						name: 'Revoke Access Link',
						value: 'revokeAccessLink',
						description: 'Revoke a signed access link so it can no longer be used',
						action: 'Revoke a signed access link so it can no longer be used',
					},
					{
						name: 'Run Card Action (Public)',
						value: 'runPublicCardAction',
						description: 'Run a declarative card action through a public signed link',
						action: 'Run a declarative card action through a public signed link',
					},
					{
						name: 'Set Scope',
						value: 'setScope',
						description: 'Update the visibility scope of a dashboard',
						action: 'Update the visibility scope of a dashboard',
					},
					{
						name: 'Update Card',
						value: 'updateCard',
						description: 'Update an existing card',
						action: 'Update an existing card',
					},
					{
						name: 'Update Column',
						value: 'updateColumn',
						description: 'Update an existing column',
						action: 'Update an existing column',
					},
					{
						name: 'Update Dashboard',
						value: 'updateDashboard',
						description: 'Update the name or card template of a dashboard',
						action: 'Update the name or card template of a dashboard',
					},
					{
						name: 'Update Panel',
						value: 'updatePanel',
						description: 'Update an existing panel',
						action: 'Update an existing panel',
					},
					{
						name: 'Update Public Config',
						value: 'updatePublicConfig',
						description: 'Create or update the public configuration of a blueprint',
						action: 'Create or update the public configuration of a blueprint',
					},
				],
				default: 'listDashboards',
			},
			{
				displayName: 'Dashboard ID',
				name: 'dashboardId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the kanban dashboard',
				displayOptions: {
					show: {
						operation: [
							'updateDashboard',
							'deleteDashboard',
							'listItems',
							'createColumn',
							'createPanel',
							'createCard',
							'createBlueprint',
							'setScope',
							'getPublicConfig',
							'updatePublicConfig',
							'createAccessLink',
							'listAccessLinks',
							'getPublicBoard',
							'movePublicCard',
							'runPublicCardAction',
						],
					},
				},
			},
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the column, panel, or card',
				displayOptions: {
					show: {
						operation: ['getItem', 'updateColumn', 'updatePanel', 'updateCard', 'deleteItem', 'moveItem'],
					},
				},
			},
			{
				displayName: 'Card ID',
				name: 'cardId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the card to move or act on',
				displayOptions: {
					show: {
						operation: ['movePublicCard', 'runPublicCardAction'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'Display name of the dashboard or column',
				displayOptions: {
					show: {
						operation: ['createDashboard', 'updateDashboard', 'createColumn', 'updateColumn', 'createBlueprint'],
					},
				},
			},
			{
				displayName: 'Card Template',
				name: 'cardTemplate',
				type: 'json',
				default: '',
				description: 'Field definitions that define the data structure of cards. Use an array of objects with ID, type, and title properties.',
				displayOptions: {
					show: {
						operation: ['createDashboard', 'updateDashboard', 'createBlueprint'],
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
						description: 'Anyone with the link can view the board through its public route',
					},
					{
						name: 'Organization',
						value: 'organization',
						description: 'Only members of the owning organization can view the board',
					},
					{
						name: 'Project',
						value: 'project',
						description: 'Only members assigned to the owning project can view the board',
					},
				],
				description: 'Visibility scope of the dashboard. Publishing a board (public) is subject to the organization plan limit.',
				displayOptions: {
					show: {
						operation: ['setScope', 'createBlueprint'],
					},
				},
			},
			{
				displayName: 'Column ID',
				name: 'columnId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the parent column',
				displayOptions: {
					show: {
						operation: ['createPanel', 'createCard'],
					},
				},
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: 'Display title of the panel',
				displayOptions: {
					show: {
						operation: ['createPanel', 'updatePanel'],
					},
				},
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '',
				description: 'Hex color code (e.g. #ff0000) or named color for visual identification',
				displayOptions: {
					show: {
						operation: ['createPanel', 'updatePanel'],
					},
				},
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '{}',
				required: true,
				description: 'Custom card data object. Keys must match the IDs defined in the dashboard card template.',
				displayOptions: {
					show: {
						operation: ['createCard', 'updateCard'],
					},
				},
			},
			{
				displayName: 'Panel ID',
				name: 'panelId',
				type: 'string',
				default: '',
				description: 'Optional reference to a specific panel within the column',
				displayOptions: {
					show: {
						operation: ['createCard', 'updateCard'],
					},
				},
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'number',
				default: 0,
				description: '0-indexed position of the item. Leave at 0 to let the platform assign the position.',
				displayOptions: {
					show: {
						operation: [
							'createColumn',
							'createPanel',
							'createCard',
							'updateColumn',
							'updatePanel',
							'updateCard',
						],
					},
				},
			},
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'options',
				default: 'column',
				options: [
					{
						name: 'Column',
						value: 'column',
					},
					{
						name: 'Panel',
						value: 'panel',
					},
					{
						name: 'Card',
						value: 'card',
					},
				],
				description: 'Type of the item to delete or move',
				displayOptions: {
					show: {
						operation: ['deleteItem', 'moveItem'],
					},
				},
			},
			{
				displayName: 'Target ID',
				name: 'targetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the target container (column or panel)',
				displayOptions: {
					show: {
						operation: ['moveItem'],
					},
				},
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'number',
				default: 0,
				description: 'New position index of the item, 0-based',
				displayOptions: {
					show: {
						operation: ['moveItem'],
					},
				},
			},
			{
				displayName: 'Provider Type',
				name: 'providerType',
				type: 'options',
				default: 'http',
				options: [
					{
						name: 'HTTP',
						value: 'http',
						description: 'Board data is fetched from an external HTTP endpoint',
					},
					{
						name: 'Internal',
						value: 'internal',
						description: 'Board data lives in LedGo and is read through the anonymous views',
					},
					{
						name: 'LedGo Database',
						value: 'ledgo-database',
						description: 'Board data is read from a LedGo custom database',
					},
					{
						name: 'Static',
						value: 'static',
						description: 'Board data is a static payload stored with the configuration',
					},
				],
				description: 'Provider that feeds the board',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Provider Manifest URL',
				name: 'providerManifestUrl',
				type: 'string',
				default: '',
				description: 'URL of the provider manifest. Leave empty to keep or clear the stored value.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Params',
				name: 'params',
				type: 'json',
				default: '',
				description: 'Parameters accepted by the public read endpoint. Array of objects with ID, label, type, required, defaultValue, and description properties.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Read Source',
				name: 'readSource',
				type: 'json',
				default: '',
				description: 'Request used to read the board. Object with URL, method, headers, body, timeoutMs, and auth properties.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Write Source',
				name: 'writeSource',
				type: 'json',
				default: '',
				description: 'Request used to write the board back. Object with URL, method, headers, body, timeoutMs, and auth properties.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Mapping',
				name: 'mapping',
				type: 'json',
				default: '',
				description: 'Mapping applied to the provider response. Object with columns, panels, cards, version, and field map properties.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Card Actions',
				name: 'cardActions',
				type: 'json',
				default: '',
				description: 'Declarative actions offered by the cards of the board. Array of objects with ID, label, variant, requiresConfirm, allowedColumns, and allowedPanels properties.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Auth Mode',
				name: 'authMode',
				type: 'options',
				default: 'signed',
				options: [
					{
						name: 'Signed',
						value: 'signed',
						description: 'Provider requests are signed by LedGo with an HMAC secret',
					},
					{
						name: 'None',
						value: 'none',
						description: 'Provider requests carry no authentication',
					},
					{
						name: 'Forward Token',
						value: 'forward-token',
						description: 'The signed link token is forwarded to the provider, which validates it',
					},
				],
				description: 'Authentication mode applied to the provider requests',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Allow Write',
				name: 'allowWrite',
				type: 'boolean',
				default: false,
				description: 'Whether public callers may write to the board',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Single Use',
				name: 'singleUse',
				type: 'boolean',
				default: false,
				description: 'Whether each write consumes a single-use token',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig', 'createAccessLink'],
					},
				},
			},
			{
				displayName: 'Embed Allowed Origins',
				name: 'embedAllowedOrigins',
				type: 'json',
				default: '',
				description: 'Origins allowed to embed the public board. Array of origin strings, or empty to allow any origin.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Refresh Interval (MS)',
				name: 'refreshIntervalMs',
				type: 'number',
				default: 0,
				description: 'Auto-refresh interval of the public board in milliseconds. Leave at 0 to keep or clear the stored value.',
				displayOptions: {
					show: {
						operation: ['updatePublicConfig'],
					},
				},
			},
			{
				displayName: 'Link Token',
				name: 'linkToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Signed access-link token. Required when the board requires a signed link.',
				displayOptions: {
					show: {
						operation: ['getPublicBoard', 'movePublicCard', 'runPublicCardAction'],
					},
				},
			},
			{
				displayName: 'Link Scope',
				name: 'linkScope',
				type: 'options',
				default: 'view',
				options: [
					{
						name: 'View',
						value: 'view',
						description: 'The link can only read the board',
					},
					{
						name: 'Edit',
						value: 'edit',
						description: 'The link can read and write the board',
					},
				],
				description: 'Scope granted by the link',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'TTL (Seconds)',
				name: 'ttlSeconds',
				type: 'number',
				default: 0,
				description: 'Lifetime of the link in seconds, clamped by the server. Leave at 0 for the server default.',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'Access Link Params',
				name: 'accessLinkParams',
				type: 'json',
				default: '',
				description: 'Provider params forwarded to the public route as query string values. Object of key-value pairs.',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'Access Link Claims',
				name: 'accessLinkClaims',
				type: 'json',
				default: '',
				description: 'Claims exposed to the provider as {{claim.*}} placeholders. Object of key-value pairs.',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'Allowed Columns',
				name: 'allowedColumns',
				type: 'json',
				default: '',
				description: 'Columns the link may move cards into. Array of column IDs, or empty for any column.',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'Allowed Panels',
				name: 'allowedPanels',
				type: 'json',
				default: '',
				description: 'Panels the link may move cards into. Array of panel IDs, or empty for any panel.',
				displayOptions: {
					show: {
						operation: ['createAccessLink'],
					},
				},
			},
			{
				displayName: 'Link JTI',
				name: 'jti',
				type: 'string',
				default: '',
				required: true,
				description: 'Unique identifier of the access link to revoke',
				displayOptions: {
					show: {
						operation: ['revokeAccessLink'],
					},
				},
			},
			{
				displayName: 'Target Column ID',
				name: 'targetColumnId',
				type: 'string',
				default: '',
				required: true,
				description: 'Identifier of the destination column of the move',
				displayOptions: {
					show: {
						operation: ['movePublicCard'],
					},
				},
			},
			{
				displayName: 'Target Panel ID',
				name: 'targetPanelId',
				type: 'string',
				default: '',
				description: 'Identifier of the destination panel, empty for the column root',
				displayOptions: {
					show: {
						operation: ['movePublicCard'],
					},
				},
			},
			{
				displayName: 'Move Data',
				name: 'moveData',
				type: 'json',
				default: '',
				description: 'Card data after merging the destination state updates',
				displayOptions: {
					show: {
						operation: ['movePublicCard'],
					},
				},
			},
			{
				displayName: 'Action ID',
				name: 'actionId',
				type: 'string',
				default: '',
				required: true,
				description: 'Identifier of the action executed on the card',
				displayOptions: {
					show: {
						operation: ['runPublicCardAction'],
					},
				},
			},
			{
				displayName: 'Base Version',
				name: 'baseVersion',
				type: 'string',
				default: '',
				description: 'Provider version the operation is based on, for conflict detection',
				displayOptions: {
					show: {
						operation: ['movePublicCard', 'runPublicCardAction'],
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
		case 'listDashboards':
			return ledgoApiRequest.call(this, 'GET', '/kanbans/dashboards');

		case 'createDashboard': {
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const cardTemplate = parseJsonParameter(this.getNodeParameter('cardTemplate', itemIndex, ''));
			const body: IDataObject = { name };
			const hasCardTemplate = isParameterProvided(cardTemplate);

			if (hasCardTemplate) {
				body.cardTemplate = cardTemplate;
			}

			return ledgoApiRequest.call(this, 'POST', '/kanbans/dashboards', body);
		}

		case 'createBlueprint': {
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const cardTemplate = parseJsonParameter(this.getNodeParameter('cardTemplate', itemIndex, ''));
			const scope = this.getNodeParameter('scope', itemIndex, 'project') as string;
			const body: IDataObject = { name, boardType: 'blueprint', scope };
			const hasCardTemplate = isParameterProvided(cardTemplate);

			if (hasCardTemplate) {
				body.cardTemplate = cardTemplate;
			}

			return ledgoApiRequest.call(this, 'POST', '/kanbans/dashboards', body);
		}

		case 'updateDashboard': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const cardTemplate = parseJsonParameter(this.getNodeParameter('cardTemplate', itemIndex, ''));
			const body: IDataObject = {};
			const hasName = isParameterProvided(name);
			const hasCardTemplate = isParameterProvided(cardTemplate);

			if (hasName) {
				body.name = name;
			}
			if (hasCardTemplate) {
				body.cardTemplate = cardTemplate;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/dashboards/${dashboardId}`, body);
		}

		case 'setScope': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const scope = this.getNodeParameter('scope', itemIndex, 'project') as string;

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/dashboards/${dashboardId}`, { scope });
		}

		case 'deleteDashboard': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/kanbans/dashboards/${dashboardId}`);

			return { success: true };
		}

		case 'listItems': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/kanbans/dashboards/${dashboardId}/items`);
		}

		case 'getItem': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/kanbans/items/${itemId}`);
		}

		case 'createColumn': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'column', name };
			const hasOrder = order !== 0;

			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'POST', `/kanbans/dashboards/${dashboardId}/items`, body);
		}

		case 'createPanel': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const columnId = this.getNodeParameter('columnId', itemIndex, '') as string;
			const title = this.getNodeParameter('title', itemIndex, '') as string;
			const color = this.getNodeParameter('color', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'panel', columnId, title };
			const hasColor = isParameterProvided(color);
			const hasOrder = order !== 0;

			if (hasColor) {
				body.color = color;
			}
			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'POST', `/kanbans/dashboards/${dashboardId}/items`, body);
		}

		case 'createCard': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const columnId = this.getNodeParameter('columnId', itemIndex, '') as string;
			const data = parseJsonParameter(this.getNodeParameter('data', itemIndex, '{}'));
			const panelId = this.getNodeParameter('panelId', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'card', columnId, data };
			const hasPanelId = isParameterProvided(panelId);
			const hasOrder = order !== 0;

			if (hasPanelId) {
				body.panelId = panelId;
			}
			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'POST', `/kanbans/dashboards/${dashboardId}/items`, body);
		}

		case 'updateColumn': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;
			const name = this.getNodeParameter('name', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'column' };
			const hasName = isParameterProvided(name);
			const hasOrder = order !== 0;

			if (hasName) {
				body.name = name;
			}
			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/items/${itemId}`, body);
		}

		case 'updatePanel': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;
			const title = this.getNodeParameter('title', itemIndex, '') as string;
			const color = this.getNodeParameter('color', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'panel' };
			const hasTitle = isParameterProvided(title);
			const hasColor = isParameterProvided(color);
			const hasOrder = order !== 0;

			if (hasTitle) {
				body.title = title;
			}
			if (hasColor) {
				body.color = color;
			}
			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/items/${itemId}`, body);
		}

		case 'updateCard': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;
			const data = parseJsonParameter(this.getNodeParameter('data', itemIndex, '{}'));
			const panelId = this.getNodeParameter('panelId', itemIndex, '') as string;
			const order = this.getNodeParameter('order', itemIndex, 0) as number;
			const body: IDataObject = { type: 'card' };
			const hasData = isParameterProvided(data);
			const hasPanelId = isParameterProvided(panelId);
			const hasOrder = order !== 0;

			if (hasData) {
				body.data = data;
			}
			if (hasPanelId) {
				body.panelId = panelId;
			}
			if (hasOrder) {
				body.order = order;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/items/${itemId}`, body);
		}

		case 'deleteItem': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;
			const itemType = this.getNodeParameter('itemType', itemIndex, 'column') as string;
			const body: IDataObject = { type: itemType };

			await ledgoApiRequest.call(this, 'DELETE', `/kanbans/items/${itemId}`, body);

			return { success: true };
		}

		case 'moveItem': {
			const itemId = this.getNodeParameter('itemId', itemIndex, '') as string;
			const itemType = this.getNodeParameter('itemType', itemIndex, 'column') as string;
			const targetId = this.getNodeParameter('targetId', itemIndex, '') as string;
			const position = this.getNodeParameter('position', itemIndex, 0) as number;
			const body: IDataObject = { type: itemType, targetId, position };

			await ledgoApiRequest.call(this, 'POST', `/kanbans/items/${itemId}/move`, body);

			return { success: true };
		}

		case 'getPublicConfig': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/kanbans/dashboards/${dashboardId}/public-config`);
		}

		case 'updatePublicConfig': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const providerType = this.getNodeParameter('providerType', itemIndex, 'http') as string;
			const providerManifestUrl = this.getNodeParameter('providerManifestUrl', itemIndex, '') as string;
			const params = parseJsonParameter(this.getNodeParameter('params', itemIndex, ''));
			const readSource = parseJsonParameter(this.getNodeParameter('readSource', itemIndex, ''));
			const writeSource = parseJsonParameter(this.getNodeParameter('writeSource', itemIndex, ''));
			const mapping = parseJsonParameter(this.getNodeParameter('mapping', itemIndex, ''));
			const cardActions = parseJsonParameter(this.getNodeParameter('cardActions', itemIndex, ''));
			const authMode = this.getNodeParameter('authMode', itemIndex, 'signed') as string;
			const allowWrite = this.getNodeParameter('allowWrite', itemIndex, false) as boolean;
			const singleUse = this.getNodeParameter('singleUse', itemIndex, false) as boolean;
			const embedAllowedOrigins = parseJsonParameter(this.getNodeParameter('embedAllowedOrigins', itemIndex, ''));
			const refreshIntervalMs = this.getNodeParameter('refreshIntervalMs', itemIndex, 0) as number;
			const body: IDataObject = {
				provider_type: providerType,
				auth_mode: authMode,
				allow_write: allowWrite,
				single_use: singleUse,
			};
			const hasProviderManifestUrl = isParameterProvided(providerManifestUrl);
			const hasParams = isParameterProvided(params);
			const hasReadSource = isParameterProvided(readSource);
			const hasWriteSource = isParameterProvided(writeSource);
			const hasMapping = isParameterProvided(mapping);
			const hasCardActions = isParameterProvided(cardActions);
			const hasEmbedAllowedOrigins = isParameterProvided(embedAllowedOrigins);
			const hasRefreshIntervalMs = refreshIntervalMs !== 0;

			if (hasProviderManifestUrl) {
				body.provider_manifest_url = providerManifestUrl;
			}
			if (hasParams) {
				body.params = params;
			}
			if (hasReadSource) {
				body.read_source = readSource;
			}
			if (hasWriteSource) {
				body.write_source = writeSource;
			}
			if (hasMapping) {
				body.mapping = mapping;
			}
			if (hasCardActions) {
				body.card_actions = cardActions;
			}
			if (hasEmbedAllowedOrigins) {
				body.embed_allowed_origins = embedAllowedOrigins;
			}
			if (hasRefreshIntervalMs) {
				body.refresh_interval_ms = refreshIntervalMs;
			}

			return ledgoApiRequest.call(this, 'PATCH', `/kanbans/dashboards/${dashboardId}/public-config`, body);
		}

		case 'createAccessLink': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const linkScope = this.getNodeParameter('linkScope', itemIndex, 'view') as string;
			const singleUse = this.getNodeParameter('singleUse', itemIndex, false) as boolean;
			const ttlSeconds = this.getNodeParameter('ttlSeconds', itemIndex, 0) as number;
			const accessLinkParams = parseJsonParameter(this.getNodeParameter('accessLinkParams', itemIndex, ''));
			const accessLinkClaims = parseJsonParameter(this.getNodeParameter('accessLinkClaims', itemIndex, ''));
			const allowedColumns = parseJsonParameter(this.getNodeParameter('allowedColumns', itemIndex, ''));
			const allowedPanels = parseJsonParameter(this.getNodeParameter('allowedPanels', itemIndex, ''));
			const body: IDataObject = { scope: linkScope, singleUse };
			const hasTtlSeconds = ttlSeconds > 0;
			const hasParams = isParameterProvided(accessLinkParams);
			const hasClaims = isParameterProvided(accessLinkClaims);
			const hasAllowedColumns = isParameterProvided(allowedColumns);
			const hasAllowedPanels = isParameterProvided(allowedPanels);

			if (hasTtlSeconds) {
				body.ttlSeconds = ttlSeconds;
			}
			if (hasParams) {
				body.params = accessLinkParams;
			}
			if (hasClaims) {
				body.claims = accessLinkClaims;
			}
			if (hasAllowedColumns) {
				body.allowedColumns = allowedColumns;
			}
			if (hasAllowedPanels) {
				body.allowedPanels = allowedPanels;
			}

			return ledgoApiRequest.call(this, 'POST', `/kanbans/dashboards/${dashboardId}/access-links`, body);
		}

		case 'listAccessLinks': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;

			return ledgoApiRequest.call(this, 'GET', `/kanbans/dashboards/${dashboardId}/access-links`);
		}

		case 'revokeAccessLink': {
			const jti = this.getNodeParameter('jti', itemIndex, '') as string;

			await ledgoApiRequest.call(this, 'DELETE', `/kanbans/access-links/${jti}`);

			return { success: true };
		}

		case 'getPublicBoard': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const linkToken = this.getNodeParameter('linkToken', itemIndex, '') as string;
			const qs: IDataObject = {};
			const hasLinkToken = isParameterProvided(linkToken);

			if (hasLinkToken) {
				qs.t = linkToken;
			}

			return ledgoApiPublicRequest.call(this, 'GET', `/public/kanbans/${dashboardId}`, undefined, qs);
		}

		case 'movePublicCard': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const linkToken = this.getNodeParameter('linkToken', itemIndex, '') as string;
			const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
			const targetColumnId = this.getNodeParameter('targetColumnId', itemIndex, '') as string;
			const targetPanelId = this.getNodeParameter('targetPanelId', itemIndex, '') as string;
			const moveData = parseJsonParameter(this.getNodeParameter('moveData', itemIndex, ''));
			const baseVersion = this.getNodeParameter('baseVersion', itemIndex, '') as string;
			const body: IDataObject = {
				event: 'card_moved',
				cardId,
				to: { columnId: targetColumnId, panelId: targetPanelId || null },
				data: isParameterProvided(moveData) ? moveData : {},
			};
			const hasBaseVersion = isParameterProvided(baseVersion);

			if (hasBaseVersion) {
				body.baseVersion = baseVersion;
			}

			return ledgoApiPublicRequest.call(
				this,
				'POST',
				`/public/kanbans/${dashboardId}/move`,
				body,
				{ t: linkToken },
			);
		}

		case 'runPublicCardAction': {
			const dashboardId = this.getNodeParameter('dashboardId', itemIndex, '') as string;
			const linkToken = this.getNodeParameter('linkToken', itemIndex, '') as string;
			const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
			const actionId = this.getNodeParameter('actionId', itemIndex, '') as string;
			const baseVersion = this.getNodeParameter('baseVersion', itemIndex, '') as string;
			const body: IDataObject = {
				event: 'card_action',
				cardId,
				actionId,
				data: {},
			};
			const hasBaseVersion = isParameterProvided(baseVersion);

			if (hasBaseVersion) {
				body.baseVersion = baseVersion;
			}

			return ledgoApiPublicRequest.call(
				this,
				'POST',
				`/public/kanbans/${dashboardId}/move`,
				body,
				{ t: linkToken },
			);
		}

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
	}
}