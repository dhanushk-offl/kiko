# Architecture

The WXT extension detects focused standard text fields and mounts a React dialog on demand. The background script proxies explicit writing requests to a loopback-only Bun companion. Shared types and validation live in `packages/shared`; the adapter contract lives in `packages/agent-protocol`. The companion emits newline-delimited JSON events and aborts generation when the connection closes.

Claude Code generation is experimental and requires safe mode. OpenCode and Codex generation are disabled. OpenCode v1 and v2 have different permission schemas and v2 can use a shared server; an isolated, version-aware integration must prove all tools and plugins are disabled before this boundary can be considered safe. Only then should additional providers be implemented. The UI currently exposes a free-form OpenCode model identifier, not a discovered model picker.
