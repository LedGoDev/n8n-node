import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LedGoApi implements ICredentialType {
	name = 'ledgoApi';

	displayName = 'LedGo API';

	documentationUrl = 'https://github.com/ledgo/n8n-nodes-ledgo';

	icon: Icon = { light: 'file:../icons/ledgo.svg', dark: 'file:../icons/ledgo.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.ledgo.ai',
			placeholder: 'https://api.ledgo.ai',
			description: 'Base URL of the LedGo API',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			description: 'Unique identifier of the organization. All operations are scoped to this organization.',
		},
		{
			displayName: 'API Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Integration token generated in the organization settings',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/organizations/{{$credentials.organizationId}}/kanbans/dashboards',
			method: 'GET',
		},
	};
}