# Security

This is an incomplete development build. Do not use it for sensitive content. The companion uses a per-process random token, validates requests, limits request size and rate, checks extension origins, and binds to IPv4 loopback. A token pasted into extension settings is stored in browser extension storage; restarting the companion rotates it. Local processes running as the same user can access the token in the terminal or browser profile. Origin checks do not authenticate an extension on their own: the token is required as well.

The Claude adapter requires safe mode, denies tools and MCP, and sends text over stdin. Managed Claude hooks can still apply. The OpenCode adapter fails closed until its execution and tool restrictions are verified. Never treat page text as trusted instructions, never invoke a shell with user text, and verify provider-specific configuration precedence, plugins, subprocess cleanup, session persistence, and prompt exposure before enabling generation. Prompt instructions alone cannot guarantee compliance.

The extension does not claim safe insertion into rich editors. Standard field replacement checks the captured value for intervening changes, but undo behavior and site-specific integrations require browser testing. Please report security issues privately to the project maintainers.
