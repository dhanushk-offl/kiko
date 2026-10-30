# Kiko

Your agent. Your words. Anywhere.

**Development status: incomplete, not ready for use.** The extension and companion build. Claude Code has an experimental adapter that requires a version supporting `--safe-mode`; an authenticated generation and browser end-to-end flow have not been verified. OpenCode and Codex generation remain disabled while their tool isolation is verified.

## Development

Install [Bun](https://bun.sh/) (1.4.2 or compatible), then:

```sh
bun install
bun run dev:companion
bun run build
```

Load `apps/extension/.output/chrome-mv3` using Chrome's developer mode, or load `apps/extension/.output/firefox-mv2/manifest.json` temporarily through Firefox's `about:debugging`. Open extension settings and paste the token printed by the companion. The token changes each time the companion starts. The companion listens only on `127.0.0.1:43127`.

Run `bun run typecheck`, `bun run lint`, and `bun run test` for local checks. `bun run dev:extension` runs WXT in development mode.

## Current scope

The interface captures a selected portion of a standard input or textarea (or its entire value if nothing is selected), previews the response, and only replaces the text after acceptance if the field hasn't changed. It excludes common sensitive inputs. Contenteditable and rich editors are not supported yet. Do not rely on this development build for sensitive writing.

The companion requires a random bearer token and extension origin, validates and limits requests, rate-limits them, and binds to loopback. There is no analytics. Browser text is not stored by Kiko, but future agent integrations may persist sessions or send text to external providers; their privacy and billing terms apply. OpenCode authentication and provider setup remain the user's responsibility.

See [agent integrations](docs/agents.md), [architecture](docs/architecture.md), and [security](docs/security.md) for known limitations.
