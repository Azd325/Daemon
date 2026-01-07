# Daemon MCP Server

This directory contains the Cloudflare Worker that serves your daemon data via the Model Context Protocol (MCP).

## Architecture

The MCP server:
1. Receives JSON-RPC 2.0 requests
2. Fetches `daemon.md` from your main site
3. Parses the markdown file into structured data
4. Returns the data in MCP format

## Setup & Deployment

### 1. Install Dependencies

```bash
cd mcp-server
bun install
```

### 2. Test Locally

```bash
bun run dev
```

This starts a local development server. Test it with:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### 3. Deploy to Cloudflare

First, make sure you're logged in to Cloudflare:

```bash
bunx wrangler login
```

Then deploy:

```bash
bun run deploy
```

This will deploy the worker and give you a `*.workers.dev` URL.

### 4. Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages
2. Click on your `daemon-mcp-server` worker
3. Go to Settings → Triggers → Custom Domains
4. Add custom domain: `mcp.daemon.timkleinschmidt.com`

Alternatively, you can configure it in `wrangler.toml`:

```toml
routes = [
  { pattern = "mcp.daemon.timkleinschmidt.com", custom_domain = true }
]
```

Then redeploy:

```bash
bun run deploy
```

## Testing

Test your deployed MCP server:

```bash
# List available tools
curl -X POST https://mcp.daemon.timkleinschmidt.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Get all data
curl -X POST https://mcp.daemon.timkleinschmidt.com \
  -H "Content-Type": "application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_all",
      "arguments": {}
    },
    "id": 2
  }'

# Get current location
curl -X POST https://mcp.daemon.timkleinschmidt.com \
  -H "Content-Type": "application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_current_location",
      "arguments": {}
    },
    "id": 3
  }'
```

## Available Tools

- `get_about` - Your bio
- `get_current_location` - Your current location
- `get_mission` - Your mission statement
- `get_preferences` - Your preferences
- `get_telos` - TELOS framework (if configured)
- `get_favorite_books` - Favorite books
- `get_favorite_movies` - Favorite movies
- `get_favorite_podcasts` - Favorite podcasts
- `get_daily_routine` - Daily routine
- `get_predictions` - Predictions
- `get_all` - All data combined
- `get_section` - Get any section by name

## How It Works

1. The worker fetches `https://daemon.timkleinschmidt.com/daemon.md`
2. Parses sections marked with `[SECTION_NAME]`
3. Converts list items (lines starting with `-`) into arrays
4. Returns data in JSON-RPC 2.0 format

## Costs

Cloudflare Workers free tier includes:
- 100,000 requests per day
- First 10ms of CPU time per request free

This MCP server should easily fit within free tier limits.

## Troubleshooting

**Error: "Failed to fetch daemon data"**
- Make sure your main site is deployed and `daemon.md` is accessible
- Check that the URL in `worker.ts` matches your domain

**CORS errors**
- The worker includes CORS headers for all origins
- If you need to restrict, modify the `corsHeaders` in `worker.ts`

**Worker not updating**
- Clear Cloudflare cache
- Wait a few seconds after deployment for global propagation
