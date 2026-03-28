# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cline is an autonomous coding agent VS Code extension (also runs as CLI and standalone). It communicates with AI providers, executes tool calls (file edits, terminal commands, browser automation), and presents changes for user approval. Built with TypeScript, React webview, and Protocol Buffers for IPC.

## Build & Development Commands

```bash
# Initial setup
npm run install:all          # Install extension + webview deps

# Build
npm run compile              # Type-check + lint + esbuild (NOT "npm run build")
npm run watch                # Watch extension + webview concurrently
npm run dev                  # protos + watch (full dev loop)
npm run dev:webview          # Webview dev server only (port 25463)
npm run build:webview        # Production webview build

# Proto code generation — run after ANY .proto change
npm run protos               # Generates src/shared/proto/, src/generated/, webview-ui clients

# CLI
npm run cli:build            # Build CLI
npm run cli:run              # Run CLI
npm run cli:test             # CLI tests (Vitest)

# Testing
npm run test:unit            # Mocha unit tests (co-located __tests__/ dirs)
npm run test:integration     # VS Code integration tests
npm run test:webview         # Webview tests (Vitest + jsdom)
npm run test:e2e             # Full E2E (Playwright + VS Code)
UPDATE_SNAPSHOTS=true npm run test:unit  # Regenerate prompt snapshots after system prompt changes

# Linting & formatting (Biome)
npm run lint                 # Biome lint + proto lint
npm run format               # Check formatting (changed files)
npm run format:fix           # Auto-fix formatting

# Type checking
npm run check-types          # tsc --noEmit for extension + webview + CLI
```

## Architecture

**Entry point:** `src/extension.ts` activates the extension, creates a `Controller` per webview panel.

**Three targets, one codebase:**
1. **VS Code extension** (`src/`) — esbuild → `dist/extension.js`
2. **Standalone server** (`src/standalone/`) — esbuild → `dist-standalone/cline-core.js`
3. **CLI** (`cli/`) — separate esbuild, React Ink TUI

All targets share `src/core/`, `src/shared/`, `src/services/`, `src/integrations/` with platform-specific code injected via `HostProvider` singleton (`src/hosts/host-provider.ts`).

### Core Execution Flow

```
User message → webview postMessage → Controller → Task.startTask()
→ Task.initiateTaskLoop() → Task.recursivelyMakeClineRequests()
→ Task.attemptApiRequest() (async generator, streams from API provider)
→ parseAssistantMessageV2() detects tool use
→ ToolExecutor.executeTool() dispatches to handlers in src/core/task/tools/handlers/
→ Tool result fed back as user message, loop continues until attempt_completion or abort
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/core/controller/` | Message handling, state management, gRPC dispatch |
| `src/core/task/` | Agent loop (`index.ts`), `ToolExecutor.ts`, tool handlers |
| `src/core/api/providers/` | 30+ API provider implementations (Anthropic, OpenAI, Gemini, etc.) |
| `src/core/prompts/` | System prompt generation (components + variants + templates) |
| `src/core/assistant-message/` | Streaming response parser |
| `src/hosts/` | Platform abstraction (VS Code vs CLI vs standalone) |
| `src/services/mcp/` | MCP (Model Context Protocol) hub |
| `src/shared/` | Types used by both extension and webview |
| `webview-ui/` | React/Vite/Tailwind webview app |
| `proto/` | Protocol Buffer service definitions |
| `cli/` | CLI with React Ink TUI |

### Extension-Webview Communication (ProtoBus)

Not raw JSON — a gRPC-inspired protocol over VS Code `postMessage`:
- **Proto definitions** → `npm run protos` → auto-generated typed clients (`webview-ui/src/services/grpc-client.ts`)
- **Webview** sends `GrpcRequest` (service + method + message) → **Extension** dispatches via `ServiceRegistry` → handler returns `GrpcResponse`
- Streaming subscriptions use `is_streaming: true` for long-lived state updates

### System Prompt Architecture

Modular with model-specific variants:
- `components/` — shared sections (rules, capabilities, tool use)
- `variants/` — model families: `generic/` (fallback), `next-gen/`, `gpt-5/`, `gemini-3/`, `xs/`, `hermes/`, `glm/`
- `templates/` — `{{PLACEHOLDER}}` resolution engine
- Variants override components via `componentOverrides` in `config.ts` or custom `template.ts`

## Detailed Tribal Knowledge

@.clinerules/general.md
@.clinerules/network.md
@.clinerules/cli.md
