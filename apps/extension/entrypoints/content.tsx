import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { defaultSettings } from '@kiko/shared';
import { capture, isTextField, type TextField } from '../lib/selection';
import css from '../style.css?inline';

export default defineContentScript({ matches: ['http://*/*', 'https://*/*'], main(ctx) {
  let field: TextField | null = null; let root: Root | null = null; let host: HTMLElement | null = null;
  let button: HTMLButtonElement | null = null;
  const position = () => { if (!field || !button || !field.isConnected) { if (button) button.hidden = true; return; } const rect = field.getBoundingClientRect(); button.style.left = `${Math.max(4, Math.min(innerWidth - 36, rect.right - 36))}px`; button.style.top = `${Math.max(4, Math.min(innerHeight - 36, rect.bottom - 36))}px`; };
  const close = () => { root?.unmount(); root = null; host?.remove(); host = null; field?.focus(); };
  const open = async () => {
    if (!field || !field.isConnected || root) return;
    const snapshot = capture(field); const Dialog = (await import('../components/Dialog')).Dialog;
    host = document.createElement('div'); host.style.cssText = 'position:fixed;z-index:2147483647;right:20px;bottom:20px'; document.documentElement.append(host);
    const shadow = host.attachShadow({ mode: 'closed' }); const style = document.createElement('style'); style.textContent = css; shadow.append(style); const mount = document.createElement('div'); shadow.append(mount); root = createRoot(mount); root.render(<Dialog snapshot={snapshot} onClose={close} />);
  };
  const focus = async (event: FocusEvent) => {
    if (!isTextField(event.target)) return;
    const settings = { ...defaultSettings, ...await browser.storage.local.get(Object.keys(defaultSettings)) };
    if (!settings.enabled || settings.disabledSites.includes(location.hostname)) return;
    field = event.target; if (!button) { button = document.createElement('button'); button.textContent = '✳'; button.setAttribute('aria-label', 'Open Kiko writing assistant'); button.style.cssText = 'position:fixed;z-index:2147483646;width:30px;height:30px;border:1px solid #e5c18a;border-radius:50%;background:#fff8e9;color:#9a4e0b;font-size:18px;cursor:pointer;box-shadow:0 2px 8px #0002'; button.addEventListener('mousedown', e => e.preventDefault()); button.addEventListener('click', open); document.documentElement.append(button); }
    button.hidden = !settings.floatingButton; position();
  };
  document.addEventListener('focusin', focus); window.addEventListener('scroll', position, true); window.addEventListener('resize', position);
  const listener = (message: { type: string }) => { if (message.type === 'open-kiko') void open(); }; browser.runtime.onMessage.addListener(listener);
  ctx.onInvalidated(() => { document.removeEventListener('focusin', focus); window.removeEventListener('scroll', position, true); window.removeEventListener('resize', position); browser.runtime.onMessage.removeListener(listener); root?.unmount(); host?.remove(); button?.remove(); });
} });
