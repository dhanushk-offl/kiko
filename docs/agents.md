# Agent integrations

Kiko's agent boundary is intentionally provider-specific. An executable being installed does not prove that it is authenticated or that the configured model is available.

Claude Code integration uses the documented non-interactive CLI, `--safe-mode`, an empty built-in tool list, a wildcard tool denial, strict MCP configuration, and no session persistence. Kiko requires a CLI that advertises `--safe-mode` and fails closed on older versions. The writing prompt is sent through stdin. Managed Claude settings and hooks may still apply even in safe mode; see the [Claude CLI reference](https://code.claude.com/docs/en/cli-reference). Configure and sign in through Claude Code itself; account eligibility and billing are determined by Anthropic. The current implementation has not been tested with an authenticated account.

OpenCode and Codex generation remain disabled pending validation of their tool isolation. OpenCode v2's [ACP interface](https://opencode.ai/v2/docs/cli/acp/) supports streaming, model options, and cancellation, but its agent can execute tools without asking the ACP client when configured to allow them. Its [permissions](https://opencode.ai/v2/docs/permissions/) and [policy precedence](https://opencode.ai/v2/docs/policies/) must therefore be enforced independently, including plugins and managed settings. Codex's documented read-only sandbox does not by itself disable command execution; its individual tool configuration and user/managed settings need a version-aware audit. Kiko does not read or copy agent credentials.

Kiko intentionally does not add execution hooks to writing requests: hooks are executable local programs and are unnecessary for text generation. Managed hooks in an agent may still run according to that agent's policy.
