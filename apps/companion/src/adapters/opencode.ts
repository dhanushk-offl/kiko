import { spawn } from 'node:child_process';
import type { AgentAdapter, WritingEvent } from '@kiko/agent-protocol';

/** The adapter deliberately fails closed until tool denial is verified for each supported OpenCode version. */
export class OpenCodeAdapter implements AgentAdapter {
  id = 'opencode'; name = 'OpenCode';
  async detect(): Promise<boolean> {
    return new Promise((resolve) => { const child = spawn('opencode', ['--version'], { stdio: 'ignore' }); child.once('error', () => resolve(false)); child.once('close', (code) => resolve(code === 0)); });
  }
  async getStatus() { const available = await this.detect(); return { available, message: available ? 'OpenCode is installed, but writing is unavailable until its tool restrictions are verified.' : 'OpenCode could not start. Install it and check its setup.' }; }
  async *generate(): AsyncIterable<WritingEvent> {
    yield { type: 'error', message: 'OpenCode writing is not enabled yet: its tool restrictions have not been verified for this installation.' };
  }
}
