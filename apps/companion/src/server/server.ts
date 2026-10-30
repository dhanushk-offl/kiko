import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { validateRequest } from '@kiko/shared';
import type { AgentAdapter } from '@kiko/agent-protocol';

export function createCompanion(adapters: AgentAdapter | AgentAdapter[], token = randomBytes(32).toString('hex')) {
  const agents = Array.isArray(adapters) ? adapters : [adapters];
  const recent: number[] = [];
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const origin = req.headers.origin || '';
    // Only extension origins may make cross-origin requests. The bearer token remains required.
    if (!/^(chrome-extension|moz-extension):\/\/[a-z0-9-]+$/i.test(origin)) { res.writeHead(403).end(); return; }
    res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const provided = (req.headers.authorization || '').replace(/^Bearer /, '');
    const a = Buffer.from(provided); const b = Buffer.from(token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) { res.writeHead(401).end(); return; }
    const now = Date.now(); while (recent.length && recent[0]! < now - 60000) recent.shift();
    if (recent.length >= 30) { res.writeHead(429).end('Too many requests. Please wait a moment.'); return; }
    recent.push(now);
    if (req.method === 'POST' && req.url === '/health') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await Promise.all(agents.map(async agent => ({ id: agent.id, name: agent.name, ...await agent.getStatus() }))))); return; }
    if (req.method !== 'POST' || req.url !== '/write' || !req.headers['content-type']?.startsWith('application/json')) { res.writeHead(404).end(); return; }
    let body = ''; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 30000) { res.writeHead(413).end(); return; } body += chunk.toString(); }
    let value: unknown; try { value = JSON.parse(body); } catch { res.writeHead(400).end('Invalid JSON'); return; }
    if (!validateRequest(value)) { res.writeHead(400).end('Invalid writing request'); return; }
    const adapter = value.provider ? agents.find(agent => agent.id === value.provider) : agents[0];
    if (!adapter) { res.writeHead(400).end('Unsupported provider'); return; }
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const controller = new AbortController(); res.on('close', () => controller.abort());
    try { for await (const event of adapter.generate(value, controller.signal)) { if (!res.destroyed) res.write(JSON.stringify(event) + '\n'); } }
    catch { if (!res.destroyed) res.write(JSON.stringify({ type: 'error', message: 'Could not start the agent. Check the companion and agent setup.' }) + '\n'); }
    res.end();
  });
  return { server, token };
}
