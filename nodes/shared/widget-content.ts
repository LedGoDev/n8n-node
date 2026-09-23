import type { IDataObject } from 'n8n-workflow';

export interface IWidgetLike {
	id: string;
	widgetType: string;
	config: IDataObject;
	position?: IDataObject;
}

export type WidgetTextFormat = 'ai' | 'markdown' | 'plain';

export function widgetsToContent(widgets: IWidgetLike[], format: WidgetTextFormat = 'ai'): string {
	const ordered = [...widgets].sort((a, b) => {
		const rowDiff = (a.position?.y as number ?? 0) - (b.position?.y as number ?? 0);

		if (rowDiff !== 0) {
			return rowDiff;
		}

		const colDiff = (a.position?.x as number ?? 0) - (b.position?.x as number ?? 0);

		return colDiff;
	});

	if (format === 'markdown') {
		return ordered.map(widgetToMarkdown).join('\n\n');
	}

	if (format === 'plain') {
		return ordered.map(widgetToText).join('\n\n');
	}

	return ordered.map(widgetToAIText).join('\n\n');
}

export function widgetToMarkdown(widget: IWidgetLike): string {
	const { widgetType, config } = widget;

	switch (widgetType) {
		case 'metrics': {
			const c = config as IDataObject;
			const value = `${c.prefix ?? ''}${c.value ?? ''}${c.suffix ?? ''}`;
			const unit = c.unit ? ` ${c.unit}` : '';
			const trend = c.trend === 'up' ? '(up)' : c.trend === 'down' ? '(down)' : '(neutral)';

			return `**${c.title ?? ''}**: ${value}${unit} ${trend}`.trim();
		}

		case 'title': {
			const c = config as IDataObject;
			const level = Math.min(Math.max(Number(c.level ?? 1), 1), 5);

			return `${'#'.repeat(level)} ${c.content ?? ''}`.trim();
		}

		case 'toggle': {
			const c = config as IDataObject;
			const isOn = c.currentValue ?? c.defaultValue ?? false;
			const state = isOn ? 'x' : ' ';

			return `- [${state}] ${c.label ?? ''}`.trim();
		}

		case 'button': {
			const c = config as IDataObject;
			const label = c.label || c.action || 'Button';

			return `[${label}](${c.action ?? ''})`;
		}

		case 'image': {
			const c = config as IDataObject;
			const alt = c.alt || 'image';

			return `![${alt}](${c.src ?? ''})`;
		}

		case 'textarea':
			return (config.content as string) ?? '';

		case 'code': {
			const c = config as IDataObject;

			return `\`\`\`${c.language ?? ''}\n${c.code ?? ''}\n\`\`\``;
		}

		case 'chart': {
			const c = config as IDataObject;
			const header = `**${c.title ?? ''}** (${c.type ?? 'chart'})`.trim();
			const labels = String(c.labels ?? '').split(',').map((label) => label.trim()).filter(Boolean);
			const values = String(c.data ?? '').split(',').map((value) => value.trim()).filter(Boolean);

			if (labels.length === 0 && values.length === 0) {
				return header;
			}

			const rows = labels.length > 0
				? labels.map((label, index) => [label, values[index] ?? ''])
				: values.map((value, index) => [String(index + 1), value]);
			const table = [
				'| Label | Value |',
				'| --- | --- |',
				...rows.map(([label, value]) => `| ${escapeTableCell(label)} | ${escapeTableCell(value)} |`),
			];

			return `${header}\n\n${table.join('\n')}`;
		}

		case 'progress_bar': {
			const c = config as IDataObject;

			return `**${c.label ?? ''}**: ${c.value ?? 0}%`.trim();
		}

		case 'progress_bar_list': {
			const c = config as IDataObject;
			const items = Array.isArray(c.items) ? (c.items as IDataObject[]) : [];

			return items.map((item) => `- **${item.label}**: ${item.value}%`).join('\n');
		}

		case 'youtube': {
			const c = config as IDataObject;

			return `[Watch on YouTube](${c.url ?? ''})`;
		}

		case 'link': {
			const c = config as IDataObject;
			const label = c.label || c.url || '';

			return `[${label}](${c.url ?? ''})`;
		}

		case 'table': {
			const c = config as IDataObject;
			const columns = Array.isArray(c.columns) ? (c.columns as string[]) : [];

			if (columns.length === 0) {
				return '';
			}

			const rows = Array.isArray(c.rows) ? (c.rows as unknown[][]) : [];
			const rowLines = rows.map((row) => {
				const cells = Array.from({ length: columns.length }, (_, index) => escapeTableCell(row[index]));
				const line = `| ${cells.join(' | ')} |`;

				return line;
			});
			const header = `| ${columns.map((column) => escapeTableCell(column)).join(' | ')} |`;
			const separator = `| ${columns.map(() => '---').join(' | ')} |`;

			return [header, separator, ...rowLines].join('\n');
		}

		case 'list': {
			const c = config as IDataObject;
			const style = (c.style as string) ?? 'bullets';
			const items = Array.isArray(c.items) ? (c.items as IDataObject[]) : [];

			return items.map((item, index) => `${markdownListItemMarker(item, index, style)} ${item.text}`).join('\n');
		}

		case 'divider':
			return '---';

		case 'embed': {
			const c = config as IDataObject;
			const resourceType = c.resourceType ?? 'resource';

			return `> Embed: ${resourceType} \`${c.resourceId ?? ''}\``;
		}

		default:
			return JSON.stringify(config, null, 2);
	}
}

export function widgetToText(widget: IWidgetLike): string {
	const { widgetType, config } = widget;

	switch (widgetType) {
		case 'metrics': {
			const c = config as IDataObject;
			const value = `${c.prefix ?? ''}${c.value ?? ''}${c.suffix ?? ''}`;
			const unit = c.unit ? ` ${c.unit}` : '';
			const trend = c.trend ?? 'neutral';

			return `${c.title ?? ''}: ${value}${unit} (${trend})`.trim();
		}

		case 'title':
			return ((config.content as string) ?? '').trim();

		case 'toggle': {
			const c = config as IDataObject;
			const isOn = c.currentValue ?? c.defaultValue ?? false;
			const stateLabel = isOn ? c.onLabel ?? 'On' : c.offLabel ?? 'Off';

			return `${c.label ?? ''}: ${stateLabel}`.trim();
		}

		case 'button': {
			const c = config as IDataObject;

			return `${c.label ?? ''}: ${c.action ?? ''}`.trim();
		}

		case 'image': {
			const c = config as IDataObject;
			const alt = c.alt || 'image';

			return `Image: ${alt} (${c.src ?? ''})`.trim();
		}

		case 'textarea':
			return (config.content as string) ?? '';

		case 'code': {
			const c = config as IDataObject;
			const language = c.language || 'text';

			return `Code (${language}):\n${c.code ?? ''}`;
		}

		case 'chart': {
			const c = config as IDataObject;
			const labels = String(c.labels ?? '').split(',').map((label) => label.trim()).filter(Boolean);
			const values = String(c.data ?? '').split(',').map((value) => value.trim()).filter(Boolean);
			const rows = labels.length > 0
				? labels.map((label, index) => `${label}: ${values[index] ?? ''}`)
				: values.map((value, index) => `${index + 1}: ${value}`);
			const lines = [`${c.title ?? ''} (${c.type ?? 'chart'})`, ...rows];

			return lines.join('\n').trim();
		}

		case 'progress_bar': {
			const c = config as IDataObject;

			return `${c.label ?? ''}: ${c.value ?? 0}%`.trim();
		}

		case 'progress_bar_list': {
			const c = config as IDataObject;
			const items = Array.isArray(c.items) ? (c.items as IDataObject[]) : [];

			return items.map((item) => `${item.label}: ${item.value}%`).join('\n');
		}

		case 'youtube':
			return `YouTube: ${config.url ?? ''}`.trim();

		case 'link': {
			const c = config as IDataObject;

			return `${c.label ?? ''}: ${c.url ?? ''}`.trim();
		}

		case 'table': {
			const c = config as IDataObject;
			const columns = Array.isArray(c.columns) ? (c.columns as string[]) : [];

			if (columns.length === 0) {
				return '';
			}

			const rows = Array.isArray(c.rows) ? (c.rows as unknown[][]) : [];
			const rowLines = rows.map((row) => columns.map((_, index) => row[index] ?? '').join(' | '));
			const header = `Columns: ${columns.join(' | ')}`;

			return [header, ...rowLines].join('\n');
		}

		case 'list': {
			const c = config as IDataObject;
			const style = (c.style as string) ?? 'bullets';
			const items = Array.isArray(c.items) ? (c.items as IDataObject[]) : [];

			return items.map((item, index) => `${plainListItemMarker(item, index, style)} ${item.text}`).join('\n');
		}

		case 'divider':
			return '---';

		case 'embed': {
			const c = config as IDataObject;
			const resourceType = c.resourceType ?? 'resource';

			return `Embed: ${resourceType} (${c.resourceId ?? ''})`.trim();
		}

		default:
			return JSON.stringify(config, null, 2);
	}
}

export function widgetToAIText(widget: IWidgetLike): string {
	const markdown = widgetToMarkdown(widget);

	return `${widget.id}:\n${buildMarkdownFence(markdown)}`;
}

function escapeTableCell(value: unknown): string {
	return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function buildMarkdownFence(content: string, language = 'md'): string {
	const runs = content.match(/`+/g) ?? [];
	const longestRun = runs.reduce((max, run) => Math.max(max, run.length), 0);
	const fence = '`'.repeat(Math.max(3, longestRun + 1));

	return `${fence}${language}\n${content}\n${fence}`;
}

function markdownListItemMarker(item: IDataObject, index: number, style: string): string {
	if (style === 'numbered') {
		return `${index + 1}.`;
	}

	if (style === 'checklist') {
		const state = item.checked ? 'x' : ' ';

		return `- [${state}]`;
	}

	return '-';
}

function plainListItemMarker(item: IDataObject, index: number, style: string): string {
	if (style === 'numbered') {
		return `${index + 1}.`;
	}

	if (style === 'checklist') {
		const state = item.checked ? 'x' : ' ';

		return `[${state}]`;
	}

	return '-';
}