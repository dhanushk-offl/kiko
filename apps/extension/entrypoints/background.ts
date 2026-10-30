import type { WritingRequest } from '@kiko/shared';
export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'open-kiko') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await browser.tabs.sendMessage(tab.id, { type: 'open-kiko' }).catch(() => undefined);
  });
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'writing') return;
    const controller = new AbortController(); port.onDisconnect.addListener(() => controller.abort());
    port.onMessage.addListener(async (message: { request: WritingRequest }) => {
      try {
        const { token } = await browser.storage.local.get('token');
        if (!token) throw new Error('Pair Kiko with the companion in settings first.');
        const response = await fetch('http://127.0.0.1:43127/write', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(message.request), signal: controller.signal });
        if (!response.ok || !response.body) throw new Error(response.status === 401 ? 'Pairing token expired. Copy the new token from the companion.' : 'Could not reach the companion. Check that it is running.');
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader(); let pending = '';
        while (true) { const { value, done } = await reader.read(); if (done) break; pending += value; const lines = pending.split('\n'); pending = lines.pop() ?? ''; for (const line of lines) if (line) port.postMessage(JSON.parse(line)); }
      } catch (error) { if (!controller.signal.aborted) port.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' }); }
    });
  });
});
