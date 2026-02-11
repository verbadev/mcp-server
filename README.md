# @verbadev/mcp-server

MCP server for [Verba](https://verba.dev) — manage translations directly from AI coding assistants like Claude Code, Claude Desktop, Cursor, Windsurf, VS Code (GitHub Copilot), OpenAI Codex, and more.

## Setup

### 1. Create a project and get your API key

1. Sign up at [verba.dev](https://verba.dev) and create a new translation project.
2. Go to **Settings** in your dashboard sidebar to generate your API key (`sk_...`).

### 2. Install & build

```bash
npm install @verbadev/mcp-server
npm run build
```

### 3. Configure your MCP client

#### Claude Code

```bash
claude mcp add verba -- node /path/to/mcp-server/build/index.js
```

Then set the environment variables:
```bash
export VERBA_API_KEY=sk_your_key_here
```

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "verba": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "VERBA_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "verba": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "VERBA_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### Windsurf

Add to your `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "verba": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "VERBA_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### VS Code (GitHub Copilot)

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "verba": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "VERBA_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### OpenAI Codex CLI

```bash
codex --mcp-config mcp.json
```

Where `mcp.json` contains:

```json
{
  "mcpServers": {
    "verba": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "VERBA_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### Other MCP Clients

Most MCP-compatible clients use the same configuration format. You need to provide:

- **Command**: `node`
- **Args**: `["/path/to/mcp-server/build/index.js"]`
- **Environment**: `VERBA_API_KEY` set to your API key

Refer to your client's documentation for where to place the MCP server configuration.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all your translation projects |
| `get_project` | Get project details (locales, key count) |
| `list_keys` | List translation keys with search, filter, pagination |
| `add_key` | Add a new key with auto AI-translation |
| `set_translation` | Set a translation for a key + locale |
| `translate` | AI-translate keys to target locales |
| `list_untranslated` | Find keys missing translations |
| `add_locale` | Add a new locale to a project |
| `delete_key` | Delete a translation key |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERBA_API_KEY` | Yes | — | Your Verba account API key (`sk_...`) |
| `VERBA_API_URL` | No | `https://verba.dev` | API base URL (for self-hosted) |
