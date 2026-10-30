import { afterEach, describe, expect, it } from 'vitest';
import { createCompanion } from '../apps/companion/src/server/server';
import type { AgentAdapter } from '../packages/agent-protocol/src/index';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
const adapter: AgentAdapter = { id: 'test', name: 'test', async detect() { return true; }, async getStatus() { return { available: true, message: 'ready' }; }, async *generate() { yield { type: 'text', text: 'hello' }; yield { type: 'done' }; } };
let server: Server;
afterEach(async () => { if (server) await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); });
async function setup() { const result = createCompanion(adapter, 'test-token'); server = result.server; await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${(server.address() as AddressInfo).port}`; }
describe('companion boundary', () => {
  it('rejects webpages and invalid tokens', async () => { const url = await setup(); expect((await fetch(url + '/health', { method: 'POST', headers: { Origin: 'https://example.com', Authorization: 'Bearer test-token' } })).status).toBe(403); expect((await fetch(url + '/health', { method: 'POST', headers: { Origin: 'chrome-extension://abc', Authorization: 'Bearer wrong' } })).status).toBe(401); });
  it('streams only validated requests for a paired extension', async () => { const url = await setup(); const headers = { Origin: 'chrome-extension://abc', Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }; expect((await fetch(url + '/write', { method: 'POST', headers, body: '{}' })).status).toBe(400); const res = await fetch(url + '/write', { method: 'POST', headers, body: JSON.stringify({ action: 'grammar', text: 'hi' }) }); expect(res.status).toBe(200); expect((await res.text()).trim().split('\n').map(line => JSON.parse(line).type)).toEqual(['text', 'done']); });
});
