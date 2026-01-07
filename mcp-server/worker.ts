/**
 * Daemon MCP Server
 * A Cloudflare Worker that implements JSON-RPC 2.0 protocol
 * for serving daemon data via the Model Context Protocol
 */

interface DaemonData {
  about?: string;
  current_location?: string;
  mission?: string;
  telos?: string[];
  favorite_books?: string[];
  favorite_movies?: string[];
  favorite_podcasts?: string[];
  daily_routine?: string[];
  preferences?: string[];
  predictions?: string[];
  last_updated?: string;
}

// Parse daemon.md file into structured data
function parseDaemonMd(content: string): DaemonData {
  const data: DaemonData = {};
  const sections = content.split(/\n\[([A-Z_]+)\]\n/);

  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i].toLowerCase();
    const sectionContent = sections[i + 1]?.trim();

    if (!sectionContent) continue;

    // Handle list sections (lines starting with -)
    if (sectionContent.includes('\n-')) {
      const items = sectionContent
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
      data[sectionName] = items;
    } else {
      // Handle text sections
      data[sectionName] = sectionContent;
    }
  }

  data.last_updated = new Date().toISOString();
  return data;
}

// JSON-RPC 2.0 request interface
interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: {
    name?: string;
    arguments?: any;
  };
  id: number | string;
}

// JSON-RPC 2.0 response interface
interface JsonRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: number | string;
}

// Available MCP tools
const TOOLS = [
  {
    name: 'get_about',
    description: 'Get information about Tim Kleinschmidt',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_current_location',
    description: 'Get current location',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_mission',
    description: 'Get mission statement',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_preferences',
    description: 'Get preferences and work style',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_telos',
    description: 'Get TELOS framework',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_favorite_books',
    description: 'Get favorite books',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_favorite_movies',
    description: 'Get favorite movies',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_favorite_podcasts',
    description: 'Get favorite podcasts',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_daily_routine',
    description: 'Get daily routine',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_predictions',
    description: 'Get predictions about the future',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_all',
    description: 'Get all daemon data',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_section',
    description: 'Get a specific section by name',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section name to retrieve' }
      },
      required: ['section']
    }
  }
];

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Parse JSON-RPC request
      const rpcRequest: JsonRpcRequest = await request.json();

      // Validate JSON-RPC version
      if (rpcRequest.jsonrpc !== '2.0') {
        return jsonRpcError(-32600, 'Invalid Request', rpcRequest.id, corsHeaders);
      }

      // Fetch daemon.md from the main site
      const daemonMdUrl = 'https://daemon.timkleinschmidt.com/daemon.md';
      const daemonMdResponse = await fetch(daemonMdUrl);

      if (!daemonMdResponse.ok) {
        return jsonRpcError(-32603, 'Failed to fetch daemon data', rpcRequest.id, corsHeaders);
      }

      const daemonMdContent = await daemonMdResponse.text();
      const daemonData = parseDaemonMd(daemonMdContent);

      // Handle tools/list method
      if (rpcRequest.method === 'tools/list') {
        return jsonRpcSuccess({ tools: TOOLS }, rpcRequest.id, corsHeaders);
      }

      // Handle tools/call method
      if (rpcRequest.method === 'tools/call') {
        const toolName = rpcRequest.params?.name;

        if (!toolName) {
          return jsonRpcError(-32602, 'Missing tool name', rpcRequest.id, corsHeaders);
        }

        // Execute the requested tool
        const result = await executeTool(toolName, daemonData, rpcRequest.params?.arguments);

        if (result === null) {
          return jsonRpcError(-32601, `Tool not found: ${toolName}`, rpcRequest.id, corsHeaders);
        }

        return jsonRpcSuccess(
          {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          },
          rpcRequest.id,
          corsHeaders
        );
      }

      // Method not found
      return jsonRpcError(-32601, `Method not found: ${rpcRequest.method}`, rpcRequest.id, corsHeaders);

    } catch (error) {
      return jsonRpcError(-32700, 'Parse error', 1, corsHeaders);
    }
  }
};

// Execute a tool by name
function executeTool(toolName: string, data: DaemonData, args?: any): string | object | null {
  switch (toolName) {
    case 'get_about':
      return data.about || 'About section not available';

    case 'get_current_location':
      return data.current_location || 'Location not available';

    case 'get_mission':
      return data.mission || 'Mission not available';

    case 'get_preferences':
      return data.preferences || [];

    case 'get_telos':
      return data.telos || [];

    case 'get_favorite_books':
      return data.favorite_books || [];

    case 'get_favorite_movies':
      return data.favorite_movies || [];

    case 'get_favorite_podcasts':
      return data.favorite_podcasts || [];

    case 'get_daily_routine':
      return data.daily_routine || [];

    case 'get_predictions':
      return data.predictions || [];

    case 'get_all':
      return data;

    case 'get_section':
      const sectionName = args?.section;
      if (!sectionName) {
        return 'Section name required';
      }
      return data[sectionName] || `Section '${sectionName}' not found`;

    default:
      return null;
  }
}

// Helper: Create JSON-RPC success response
function jsonRpcSuccess(result: any, id: number | string, headers: any): Response {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    result,
    id
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

// Helper: Create JSON-RPC error response
function jsonRpcError(code: number, message: string, id: number | string, headers: any): Response {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    error: { code, message },
    id
  };

  return new Response(JSON.stringify(response), {
    status: 200, // JSON-RPC errors use 200 status code
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}
