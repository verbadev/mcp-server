#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.VERBA_API_KEY;
const API_URL = (process.env.VERBA_API_URL || "https://verba.dev").replace(
  /\/$/,
  ""
);

if (!API_KEY) {
  console.error("VERBA_API_KEY environment variable is required");
  process.exit(1);
}

async function verbaApi(
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${API_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

const server = new McpServer({
  name: "verba",
  version: "0.1.0",
});

// 1. list_projects
server.tool("list_projects", "List all translation projects", {}, async () => {
  try {
    const { ok, data } = await verbaApi("GET", "/api/v1/projects");
    if (!ok) {
      return {
        content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
        isError: true,
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error: ${(error as Error).message}` },
      ],
      isError: true,
    };
  }
});

// 2. get_project
server.tool(
  "get_project",
  "Get project details including locales and key count",
  { projectId: z.string().describe("The project ID") },
  async ({ projectId }) => {
    try {
      const { ok, data } = await verbaApi(
        "GET",
        `/api/v1/projects/${projectId}`
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 3. list_keys
server.tool(
  "list_keys",
  "List translation keys with optional search, locale filter, and pagination",
  {
    projectId: z.string().describe("The project ID"),
    search: z.string().optional().describe("Search in key names and values"),
    locale: z.string().optional().describe("Filter by locale"),
    untranslated: z
      .boolean()
      .optional()
      .describe("Only show keys with missing translations"),
    page: z.number().optional().describe("Page number (default 1)"),
    pageSize: z
      .number()
      .optional()
      .describe("Results per page (default 50, max 100)"),
  },
  async ({ projectId, search, locale, untranslated, page, pageSize }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (locale) params.set("locale", locale);
      if (untranslated) params.set("untranslated", "true");
      if (page) params.set("page", String(page));
      if (pageSize) params.set("pageSize", String(pageSize));

      const qs = params.toString();
      const { ok, data } = await verbaApi(
        "GET",
        `/api/v1/projects/${projectId}/keys${qs ? `?${qs}` : ""}`
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 4. add_key
server.tool(
  "add_key",
  "Add a new translation key with a default value. Automatically AI-translates to all project locales.",
  {
    projectId: z.string().describe("The project ID"),
    key: z
      .string()
      .describe(
        "Translation key (letters, numbers, underscores, dots; must start with a letter)"
      ),
    defaultValue: z
      .string()
      .describe("The default translation value in the project's default locale"),
  },
  async ({ projectId, key, defaultValue }) => {
    try {
      const { ok, data } = await verbaApi(
        "POST",
        `/api/v1/projects/${projectId}/keys`,
        { key, defaultValue }
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 5. set_translation
server.tool(
  "set_translation",
  "Set or update a translation value for a specific key and locale. Marks as manually translated.",
  {
    projectId: z.string().describe("The project ID"),
    key: z.string().describe("The translation key"),
    locale: z.string().describe("The locale code (e.g. es, fr, de)"),
    value: z.string().describe("The translation value"),
  },
  async ({ projectId, key, locale, value }) => {
    try {
      const encodedKey = encodeURIComponent(key);
      const { ok, data } = await verbaApi(
        "PUT",
        `/api/v1/projects/${projectId}/keys/${encodedKey}/translations/${locale}`,
        { value }
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 6. translate
server.tool(
  "translate",
  "AI-translate one or more keys to target locales. Max 20 keys per request.",
  {
    projectId: z.string().describe("The project ID"),
    keys: z.array(z.string()).describe("Array of key names to translate"),
    targetLocales: z
      .array(z.string())
      .optional()
      .describe(
        "Specific locales to translate to (defaults to all non-default locales)"
      ),
  },
  async ({ projectId, keys, targetLocales }) => {
    try {
      const { ok, data } = await verbaApi(
        "POST",
        `/api/v1/projects/${projectId}/translate`,
        { keys, targetLocales }
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 7. list_untranslated
server.tool(
  "list_untranslated",
  "List keys that have missing translations, optionally filtered to a specific locale",
  {
    projectId: z.string().describe("The project ID"),
    locale: z
      .string()
      .optional()
      .describe("Only show keys missing this specific locale"),
  },
  async ({ projectId, locale }) => {
    try {
      const params = new URLSearchParams({ untranslated: "true" });
      if (locale) params.set("locale", locale);

      const { ok, data } = await verbaApi(
        "GET",
        `/api/v1/projects/${projectId}/keys?${params.toString()}`
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 8. add_locale
server.tool(
  "add_locale",
  "Add a new locale to a project (owner only)",
  {
    projectId: z.string().describe("The project ID"),
    locale: z
      .string()
      .describe("BCP-47 locale code (e.g. es, fr, pt-BR, zh-CN)"),
  },
  async ({ projectId, locale }) => {
    try {
      const { ok, data } = await verbaApi(
        "POST",
        `/api/v1/projects/${projectId}/locales`,
        { locale }
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// 9. delete_key
server.tool(
  "delete_key",
  "Delete a translation key from a project (owner only)",
  {
    projectId: z.string().describe("The project ID"),
    key: z.string().describe("The translation key to delete"),
  },
  async ({ projectId, key }) => {
    try {
      const encodedKey = encodeURIComponent(key);
      const { ok, data } = await verbaApi(
        "DELETE",
        `/api/v1/projects/${projectId}/keys/${encodedKey}`
      );
      if (!ok) {
        return {
          content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Verba MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
