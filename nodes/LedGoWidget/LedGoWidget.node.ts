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

export class LedGoWidget implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Widget',
		name: 'ledgoWidget',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage LedGo home dashboard widgets',
		defaults: {
			name: 'LedGo Widget',
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
						name: 'Create Widget',
						value: 'createWidget',
						description: 'Create a new widget on the organization home dashboard',
						action: 'Create a new widget on the organization home dashboard',
					},
					{
						name: 'Create Widgets',
						value: 'createWidgets',
						description: 'Create several widgets with one gateway call',
						action: 'Create several widgets with one gateway call',
					},
					{
						name: 'Delete Widget',
						value: 'deleteWidget',
						description: 'Delete a widget from the organization home dashboard',
						action: 'Delete a widget from the organization home dashboard',
					},
					{
						name: 'Delete Widgets',
						value: 'deleteWidgets',
						description: 'Delete several widgets with one gateway call',
						action: 'Delete several widgets with one gateway call',
					},
					{
						name: 'Get Widget',
						value: 'getWidget',
						description: 'Get a single widget by its ID',
						action: 'Get a single widget by its ID',
					},
					{
						name: 'List Widgets',
						value: 'listWidgets',
						description: 'List all widgets on the organization home dashboard',
						action: 'List all widgets on the organization home dashboard',
					},
					{
						name: 'Read Content',
						value: 'readContent',
						description: 'Read the home dashboard content as AI-readable text',
						action: 'Read the home dashboard content as AI readable text',
					},
					{
						name: 'Update Widget',
						value: 'updateWidget',
						description: 'Update a widget configuration and/or position',
						action: 'Update a widget configuration and or position',
					},
					{
						name: 'Update Widget Positions',
						value: 'updateWidgetPositions',
						description: 'Update the positions of several widgets with one gateway call',
						action: 'Update the positions of several widgets with one gateway call',
					},
					{
						name: 'Update Widgets',
						value: 'updateWidgets',
						description: 'Update several widgets with one gateway call',
						action: 'Update several widgets with one gateway call',
					},
				],
				default: 'listWidgets',
			},
			{
				displayName: 'Widget ID',
				name: 'widgetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the widget',
				displayOptions: {
					show: {
						operation: ['getWidget', 'updateWidget', 'deleteWidget'],
					},
				},
			},
			{
				displayName: 'Widget Type',
				name: 'widgetType',
				type: 'options',
				default: 'metrics',
				options: [
					{
						name: 'Button',
						value: 'button',
						description: 'A clickable button with variant styling and an action URL',
					},
					{
						name: 'Chart',
						value: 'chart',
						description: 'A chart (bar, line, pie, or area) with labels and data',
					},
					{
						name: 'Code',
						value: 'code',
						description: 'A code editor block with syntax highlighting',
					},
					{
						name: 'Image',
						value: 'image',
						description: 'Displays an image with fit mode and rounded corners',
					},
					{
						name: 'Link',
						value: 'link',
						description: 'A hyperlink with label and URL',
					},
					{
						name: 'Metrics',
						value: 'metrics',
						description: 'Displays a key metric with value, unit, and trend',
					},
					{
						name: 'Progress Bar',
						value: 'progress_bar',
						description: 'A single horizontal progress bar',
					},
					{
						name: 'Progress Bar List',
						value: 'progress_bar_list',
						description: 'A list of progress bars',
					},
					{
						name: 'Textarea',
						value: 'textarea',
						description: 'A multi-line text block for rich content',
					},
					{
						name: 'Title',
						value: 'title',
						description: 'Renders a heading with configurable level and alignment',
					},
					{
						name: 'Toggle',
						value: 'toggle',
						description: 'A toggle switch with on/off labels',
					},
					{
						name: 'YouTube',
						value: 'youtube',
						description: 'Embeds a YouTube video player by URL',
					},
				],
				description: 'Type of widget to create',
				displayOptions: {
					show: {
						operation: ['createWidget'],
					},
				},
			},
			{
				displayName: 'Config',
				name: 'config',
				type: 'json',
				default: '',
				description: 'Widget-specific configuration. The shape varies by widget type. Falls back to defaults when omitted.',
				displayOptions: {
					show: {
						operation: ['createWidget', 'updateWidget'],
					},
				},
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'json',
				default: '',
				description: 'Grid position and dimensions. Object with x, y, w, and h properties. Falls back to sensible defaults when omitted.',
				displayOptions: {
					show: {
						operation: ['createWidget', 'updateWidget'],
					},
				},
			},
			{
				displayName: 'Widgets',
				name: 'widgets',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of widgets to create. Each entry has a widgetType property and optional config and position properties.',
				displayOptions: {
					show: {
						operation: ['createWidgets'],
					},
				},
			},
			{
				displayName: 'Widget Updates',
				name: 'widgetUpdates',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of widgets to update. Each entry has an ID property and optional config and position properties.',
				displayOptions: {
					show: {
						operation: ['updateWidgets'],
					},
				},
			},
			{
				displayName: 'Widget IDs',
				name: 'widgetIds',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of widget identifiers to delete',
				displayOptions: {
					show: {
						operation: ['deleteWidgets'],
					},
				},
			},
			{
				displayName: 'Positions',
				name: 'positions',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of position updates. Each entry has a widgetId property and a position object with x, y, w, and h properties.',
				displayOptions: {
					show: {
						operation: ['updateWidgetPositions'],
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
						description: 'Widget ID followed by its Markdown inside a fenced code block',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Raw Markdown representation of each widget',
					},
					{
						name: 'Plain',
						value: 'plain',
						description: 'Plain text representation of each widget',
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
			case 'listWidgets':
				return ledgoApiRequest.call(this, 'GET', '/widgets');

			case 'getWidget': {
				const widgetId = this.getNodeParameter('widgetId', itemIndex, '') as string;

				return ledgoApiRequest.call(this, 'GET', `/widgets/${widgetId}`);
			}

			case 'createWidget': {
				const widgetType = this.getNodeParameter('widgetType', itemIndex, 'metrics') as string;
				const config = parseJsonParameter(this.getNodeParameter('config', itemIndex, ''));
				const position = parseJsonParameter(this.getNodeParameter('position', itemIndex, ''));
				const body: IDataObject = { widgetType };
				const hasConfig = isParameterProvided(config);
				const hasPosition = isParameterProvided(position);

				if (hasConfig) {
					body.config = config;
				}
				if (hasPosition) {
					body.position = position;
				}

				return ledgoApiRequest.call(this, 'POST', '/widgets', body);
			}

			case 'updateWidget': {
				const widgetId = this.getNodeParameter('widgetId', itemIndex, '') as string;
				const config = parseJsonParameter(this.getNodeParameter('config', itemIndex, ''));
				const position = parseJsonParameter(this.getNodeParameter('position', itemIndex, ''));
				const body: IDataObject = {};
				const hasConfig = isParameterProvided(config);
				const hasPosition = isParameterProvided(position);

				if (hasConfig) {
					body.config = config;
				}
				if (hasPosition) {
					body.position = position;
				}

				return ledgoApiRequest.call(this, 'PATCH', `/widgets/${widgetId}`, body);
			}

			case 'deleteWidget': {
				const widgetId = this.getNodeParameter('widgetId', itemIndex, '') as string;

				await ledgoApiRequest.call(this, 'DELETE', `/widgets/${widgetId}`);

				return { success: true };
			}

			case 'createWidgets': {
				const widgets = parseJsonParameter(this.getNodeParameter('widgets', itemIndex, '[]'));
				const widgetList = Array.isArray(widgets) ? widgets : [];
				const body: IDataObject = {
					widgets: widgetList.map((widget) => {
						const item = widget as IDataObject;
						const result: IDataObject = { widget_type: item.widgetType };

						if (item.config !== undefined) {
							result.config = item.config;
						}
						if (item.position !== undefined) {
							result.position = item.position;
						}

						return result;
					}),
				};

				return ledgoApiRequest.call(this, 'POST', '/widgets/batch', body);
			}

			case 'updateWidgets': {
				const widgetUpdates = parseJsonParameter(this.getNodeParameter('widgetUpdates', itemIndex, '[]'));
				const updateList = Array.isArray(widgetUpdates) ? widgetUpdates : [];
				const body: IDataObject = {
					widgets: updateList.map((update) => {
						const item = update as IDataObject;
						const result: IDataObject = { id: item.id };

						if (item.config !== undefined) {
							result.config = item.config;
						}
						if (item.position !== undefined) {
							result.position = item.position;
						}

						return result;
					}),
				};

				return ledgoApiRequest.call(this, 'PATCH', '/widgets/batch', body);
			}

			case 'deleteWidgets': {
				const widgetIds = parseJsonParameter(this.getNodeParameter('widgetIds', itemIndex, '[]'));
				const ids = Array.isArray(widgetIds) ? widgetIds : [];

				await ledgoApiRequest.call(this, 'DELETE', '/widgets/batch', { ids });

				return { success: true };
			}

			case 'updateWidgetPositions': {
				const positions = parseJsonParameter(this.getNodeParameter('positions', itemIndex, '[]'));
				const positionList = Array.isArray(positions) ? positions : [];
				const body: IDataObject = {
					positions: positionList.map((entry) => {
						const item = entry as IDataObject;

						return { id: item.widgetId, position: item.position };
					}),
				};

				await ledgoApiRequest.call(this, 'PATCH', '/widgets/positions', body);

				return { success: true };
			}

			case 'readContent': {
				const format = this.getNodeParameter('format', itemIndex, 'ai') as 'ai' | 'markdown' | 'plain';
				const response = await ledgoApiRequest.call(this, 'GET', '/widgets');
				const widgets = (Array.isArray(response) ? response : []) as unknown as IWidgetLike[];
				const content = widgetsToContent(widgets, format);

				return { content };
			}

			default:
				throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
		}
}
