import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AgentAdapter, WritingEvent } from '@kiko/agent-protocol';
import type { WritingRequest } from '@kiko/shared';
import { writingPrompt } from '../services/prompts';

export class ClaudeAdapter implements AgentAdapter {
  constructor(private executable = 'claude') {}
  id = 'claude'; name = 'Claude Code';
  async detect(): Promise<boolean> {
    return new Promise(resolve => { const child = spawn(this.executable, ['--version'], { stdio: 'ignore' }); child.once('error', () => resolve(false)); child.once('close', code => resolve(code === 0)); });
  }
  private async supportsSafeMode(): Promise<boolean> {
    return new Promise(resolve => {
      const child = spawn(this.executable, ['--help'], { stdio: ['ignore', 'pipe', 'ignore'] }); let help = '';
      child.stdout.on('data', chunk => { help += chunk.toString(); });
      child.once('error', () => resolve(false)); child.once('close', code => resolve(code === 0 && help.includes('--safe-mode')));
    });
  }
  async getStatus() { const available = await this.detect(); const safe = available && await this.supportsSafeMode(); return { available: safe, message: safe ? 'Claude Code is installed. Sign in to Claude Code before writing.' : available ? 'Update Claude Code to a version supporting --safe-mode before using Kiko.' : 'Claude Code could not start. Install it and sign in first.' }; }
  async *generate(request: WritingRequest, signal?: AbortSignal): AsyncIterable<WritingEvent> {
    if (!await this.supportsSafeMode()) { yield { type: 'error', message: 'Update Claude Code to a version supporting --safe-mode before using Kiko.' }; return; }
    const cwd = await mkdtemp(join(tmpdir(), 'kiko-claude-'));
    try {
      const args = ['--safe-mode', '--print', '--output-format', 'text', '--tools', '', '--disallowedTools', '*', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence', ...(request.model ? ['--model', request.model] : [])];
      const child = spawn(this.executable, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
      const closed = new Promise<number | null>((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
      const abort = () => child.kill('SIGTERM'); signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(abort, 120000); let timedOut = false; const timeout = setTimeout(() => { timedOut = true; }, 119999);
      child.stderr.resume(); child.stdin.on('error', () => undefined); child.stdin.end(writingPrompt(request));
      if (signal?.aborted) abort();
      let output = '';
      try {
        for await (const chunk of child.stdout) { const text = chunk.toString(); output += text; if (output.length > 40000) { abort(); throw new Error('Response too long'); } yield { type: 'text', text }; }
        const code = await closed;
        if (signal?.aborted) return;
        if (timedOut) yield { type: 'error', message: 'Claude Code took too long. Please try again.' };
        else if (code !== 0 || !output.trim()) yield { type: 'error', message: 'Claude Code could not generate a response. Check your sign-in, model, and account access.' };
        else yield { type: 'done' };
      } finally { clearTimeout(timer); clearTimeout(timeout); signal?.removeEventListener('abort', abort); child.kill(); }
    } finally { await rm(cwd, { recursive: true, force: true }); }
  }
}
