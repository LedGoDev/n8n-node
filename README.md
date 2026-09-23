# n8n-nodes-ledgo

[n8n](https://n8n.io) community node package that enables workflows to use the
LedGo AI Agent Engineering Platform. It provides eight nodes, one per LedGo
module:

| Node | Purpose |
| --- | --- |
| `LedGo Kanban` | Manage dashboards, columns, panels, cards, blueprint boards, and public access links |
| `LedGo Form` | Create and manage forms, list form responses, get the form session endpoint URL |
| `LedGo Database` | Manage custom databases, query and aggregate their records, and run batch operations |
| `LedGo Diagram` | Manage Mermaid.js diagrams |
| `LedGo Document` | Manage project documents and their blocks, read document content as AI-readable text |
| `LedGo Comment` | Manage comments anchored to databases and documents |
| `LedGo Widget` | Manage home dashboard widgets, including batch operations and AI-readable content |
| `LedGo Storage` | Upload, download, and delete files on storage buckets |

All nodes share a single credential type: `LedGo API`.

> Note on file naming: n8n requires node and credential files to be named
> `<NodeName>.node.ts` / `<CredentialName>.credentials.ts` with the exported
> class name matching the file name. This overrides the usual kebab-case file
> convention for this package.

## Installation

1. In your n8n instance, go to **Settings > Community Nodes**.
2. Install `@ledgo/n8n` from the npm registry.
3. Create a credential of type **LedGo API** with:

   - **Base URL**: your LedGo API base URL (e.g. `https://api.ledgo.ai`)
   - **Organization ID**: your organization unique ID (optional, when omitted the API resolves it from the token)
   - **API Token**: an integration token from Organization Settings > Integrations

## Usage

Add any LedGo node to a workflow, pick an operation, and configure its
parameters. Example: keep a kanban dashboard in sync from a webhook.

```text
Webhook → LedGo Kanban (Create Card) → LedGo Database (Create Record)
```

For the `LedGo Storage` node:

- **Upload / Upload Auto** consume a binary property from the incoming item.
- **Download** outputs the file into the binary property of your choice.

## Development

```bash
pnpm install
pnpm run build    # compile and bundle assets (uses @n8n/node-cli)
pnpm run dev      # run a local n8n instance with the nodes loaded
pnpm run lint     # lint the node code
pnpm test         # run unit tests
```

## Tests

Unit tests live in `tests/unit-tests`. The folders `tests/component-tests`,
`tests/integration-tests`, `tests/e2e-tests`, and `tests/snapshot-tests` are
reserved for their respective test types per the project conventions.

## License

MIT