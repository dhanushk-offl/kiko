import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClaudeAdapter } from '../apps/companion/src/adapters/claude';
let directory = '';
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
async function fake(safe: boolean) {
  directory = await mkdtemp(join(tmpdir(), 'kiko-test-')); const file = join(directory, 'claude');
  await writeFile(file, `#!/usr/bin/env node\nconst args = process.argv.slice(2);\nif (args.includes('--help')) { console.log(${JSON.stringify(safe ? '--safe-mode' : 'old version')}); process.exit(0); }\nif (!args.includes('--safe-mode') || !args.includes('--strict-mcp-config') || args[args.indexOf('--tools') + 1] !== '' || args[args.indexOf('--disallowedTools') + 1] !== '*') process.exit(2);\nlet input = ''; process.stdin.on('data', c => input += c); process.stdin.on('end', () => { if (!input.includes('untrusted source text')) process.exit(3); process.stdout.write('Hello!'); });\n`); await chmod(file, 0o700); return new ClaudeAdapter(file);
}
describe('Claude adapter', () => {
  it('uses safe mode, disables tools, and sends the request through stdin', async () => { const adapter = await fake(true); const events = []; for await (const event of adapter.generate({ action: 'grammar', text: 'hello' })) events.push(event); expect(events).toEqual([{ type: 'text', text: 'Hello!' }, { type: 'done' }]); });
  it('fails closed if safe mode is unsupported', async () => { const adapter = await fake(false); const events = []; for await (const event of adapter.generate({ action: 'grammar', text: 'hello' })) events.push(event); expect(events[0]).toMatchObject({ type: 'error' }); });
});
