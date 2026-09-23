import { widgetToAIText, widgetToMarkdown, widgetToText, widgetsToContent } from '../../nodes/shared/widget-content';

const metricsWidget = {
	id: 'widget-1',
	widgetType: 'metrics',
	config: { title: 'Revenue', value: 100, unit: 'USD', trend: 'up', prefix: '$', suffix: '' },
	position: { x: 0, y: 0, w: 4, h: 1 },
};

describe('widgetToMarkdown', () => {
	it('renders a metrics widget with value, unit, and trend', () => {
		const result = widgetToMarkdown(metricsWidget);

		expect(result).toBe('**Revenue**: $100 USD (up)');
	});

	it('renders a title widget with the configured heading level', () => {
		const result = widgetToMarkdown({
			id: 'widget-2',
			widgetType: 'title',
			config: { content: 'Q3 Report', level: 2, alignment: 'left' },
		});

		expect(result).toBe('## Q3 Report');
	});

	it('renders a checklist list widget with checked state', () => {
		const result = widgetToMarkdown({
			id: 'widget-3',
			widgetType: 'list',
			config: {
				items: [
					{ text: 'Task A', checked: true },
					{ text: 'Task B', checked: false },
				],
				style: 'checklist',
			},
		});

		expect(result).toBe('- [x] Task A\n- [ ] Task B');
	});

	it('renders a divider widget', () => {
		const result = widgetToMarkdown({ id: 'widget-4', widgetType: 'divider', config: {} });

		expect(result).toBe('---');
	});

	it('escapes pipes and newlines inside table cells', () => {
		const result = widgetToMarkdown({
			id: 'widget-5',
			widgetType: 'table',
			config: {
				columns: ['Name', 'Notes'],
				rows: [['a|b', 'line1\nline2']],
			},
		});

		expect(result).toContain('| a\\|b | line1 line2 |');
	});

	it('falls back to pretty-printed JSON for unknown widget types', () => {
		const result = widgetToMarkdown({ id: 'widget-6', widgetType: 'unknown', config: { key: 'value' } });

		expect(result).toContain('"key": "value"');
	});
});

describe('widgetToText', () => {
	it('renders a metrics widget in plain text', () => {
		const result = widgetToText(metricsWidget);

		expect(result).toBe('Revenue: $100 USD (up)');
	});

	it('renders a toggle widget with the current state label', () => {
		const result = widgetToText({
			id: 'widget-7',
			widgetType: 'toggle',
			config: { label: 'Notifications', defaultValue: true, currentValue: false, onLabel: 'On', offLabel: 'Off' },
		});

		expect(result).toBe('Notifications: Off');
	});

	it('renders a link widget in plain text', () => {
		const result = widgetToText({
			id: 'widget-8',
			widgetType: 'link',
			config: { label: 'Docs', url: 'https://ledgo.ai' },
		});

		expect(result).toBe('Docs: https://ledgo.ai');
	});
});

describe('widgetToAIText', () => {
	it('wraps the widget markdown in a fenced code block with the widget id', () => {
		const result = widgetToAIText(metricsWidget);

		expect(result).toBe('widget-1:\n```md\n**Revenue**: $100 USD (up)\n```');
	});

	it('grows the fence when the content contains a backtick run of 3 or more', () => {
		const result = widgetToAIText({ id: 'widget-9', widgetType: 'textarea', config: { content: 'a ``` b' } });

		expect(result).toBe('widget-9:\n````md\na ``` b\n````');
	});
});

describe('widgetsToContent', () => {
	it('orders widgets top to bottom, left to right', () => {
		const widgets = [
			{ id: 'w-bottom', widgetType: 'title', config: { content: 'Bottom', level: 1, alignment: 'left' }, position: { x: 0, y: 2 } },
			{ id: 'w-top-right', widgetType: 'title', config: { content: 'Top Right', level: 1, alignment: 'left' }, position: { x: 4, y: 0 } },
			{ id: 'w-top-left', widgetType: 'title', config: { content: 'Top Left', level: 1, alignment: 'left' }, position: { x: 0, y: 0 } },
		];
		const result = widgetsToContent(widgets, 'plain');

		expect(result).toBe('Top Left\n\nTop Right\n\nBottom');
	});

	it('produces markdown content for the markdown format', () => {
		const result = widgetsToContent([metricsWidget], 'markdown');

		expect(result).toBe('**Revenue**: $100 USD (up)');
	});

	it('produces AI content for the ai format', () => {
		const result = widgetsToContent([metricsWidget], 'ai');

		expect(result).toBe('widget-1:\n```md\n**Revenue**: $100 USD (up)\n```');
	});
});