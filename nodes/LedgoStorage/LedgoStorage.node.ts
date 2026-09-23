import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { ledgoApiRequest, ledgoApiRequestBinary, ledgoApiRequestFormData } from '../shared/transport';
import { extractFileNameFromPath } from '../shared/utils';

export class LedgoStorage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LedGo Storage',
		name: 'ledgoStorage',
		icon: { light: 'file:../../icons/logo.png', dark: 'file:../../icons/logo.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Upload, download, and delete files on LedGo storage buckets',
		defaults: {
			name: 'LedGo Storage',
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
						name: 'Upload',
						value: 'upload',
						description: 'Upload a file to a bucket with a specified path',
						action: 'Upload a file to a bucket with a specified path',
					},
					{
						name: 'Upload Auto',
						value: 'uploadAuto',
						description: 'Upload a file to a bucket with an auto-generated unique key',
						action: 'Upload a file to a bucket with an auto generated unique key',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download a file from a bucket as binary data',
						action: 'Download a file from a bucket as binary data',
					},
					{
						name: 'Delete File',
						value: 'deleteFile',
						description: 'Delete a file from a storage bucket',
						action: 'Delete a file from a storage bucket',
					},
				],
				default: 'upload',
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the storage bucket (e.g. avatars, documents)',
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				required: true,
				description: 'Object key/path of the file within the bucket',
				displayOptions: {
					show: {
						operation: ['upload', 'download', 'deleteFile'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property that contains the file to upload',
				displayOptions: {
					show: {
						operation: ['upload', 'uploadAuto'],
					},
				},
			},
			{
				displayName: 'Output Property',
				name: 'outputProperty',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property in which to store the downloaded file',
				displayOptions: {
					show: {
						operation: ['download'],
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
				const isDownload = operation === 'download';

				if (isDownload) {
					const downloadItem = await downloadFile.call(this, itemIndex);

					returnData.push(downloadItem);
					continue;
				}

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
			case 'upload': {
				const bucketName = this.getNodeParameter('bucketName', itemIndex, '') as string;
				const path = this.getNodeParameter('path', itemIndex, '') as string;
				const formData = await buildUploadFormData.call(this, itemIndex);
				const response = await ledgoApiRequestFormData.call(
					this,
					'POST',
					`/storage/buckets/${bucketName}/objects/${path}`,
					formData,
				);

				return response;
			}

			case 'uploadAuto': {
				const bucketName = this.getNodeParameter('bucketName', itemIndex, '') as string;
				const formData = await buildUploadFormData.call(this, itemIndex);
				const response = await ledgoApiRequestFormData.call(
					this,
					'POST',
					`/storage/buckets/${bucketName}/upload`,
					formData,
				);

				return response;
			}

			case 'deleteFile': {
				const bucketName = this.getNodeParameter('bucketName', itemIndex, '') as string;
				const path = this.getNodeParameter('path', itemIndex, '') as string;

				await ledgoApiRequest.call(this, 'DELETE', `/storage/buckets/${bucketName}/objects/${path}`);

				return { success: true };
			}

			default:
				throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported`);
		}
	}

	async function downloadFile(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const bucketName = this.getNodeParameter('bucketName', itemIndex, '') as string;
		const path = this.getNodeParameter('path', itemIndex, '') as string;
		const outputPropertyName = this.getNodeParameter('outputProperty', itemIndex, 'data') as string;
		const buffer = await ledgoApiRequestBinary.call(
			this,
			'GET',
			`/storage/buckets/${bucketName}/objects/${path}`,
		);
		const fileName = extractFileNameFromPath(path);
		const binaryData = await this.helpers.prepareBinaryData(buffer, fileName);
		const item: INodeExecutionData = {
			json: {},
			binary: {},
			pairedItem: { item: itemIndex },
		};

		item.binary![outputPropertyName] = binaryData;

		return item;
	}

	async function buildUploadFormData(this: IExecuteFunctions, itemIndex: number): Promise<FormData> {
		const binaryPropertyName = this.getNodeParameter('binaryProperty', itemIndex, 'data') as string;
		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		const fileName = binaryData.fileName ?? 'file';
		const formData = new FormData();

		formData.append('file', new Blob([buffer]), fileName);

		return formData;
}
