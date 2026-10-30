export const actions = ['grammar', 'improve', 'shorter', 'professional', 'friendly', 'generate', 'custom'] as const;
export type WritingAction = (typeof actions)[number];
export type Provider = 'opencode' | 'claude' | 'codex';
export interface WritingRequest { provider?: Provider; action: WritingAction; text: string; instruction?: string; language?: string; model?: string }
export interface Settings { enabled: boolean; floatingButton: boolean; token: string; provider: Provider; model: string; disabledSites: string[] }
export const defaultSettings: Settings = { enabled: true, floatingButton: true, token: '', provider: 'claude', model: '', disabledSites: [] };
export function validateRequest(value: unknown): value is WritingRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return (r.provider === undefined || r.provider === 'opencode' || r.provider === 'claude' || r.provider === 'codex') && actions.includes(r.action as WritingAction) && typeof r.text === 'string' && r.text.length <= 20000 &&
    (r.instruction === undefined || typeof r.instruction === 'string' && r.instruction.length <= 2000) &&
    (r.language === undefined || typeof r.language === 'string' && r.language.length <= 100) &&
    (r.model === undefined || typeof r.model === 'string' && /^(?:[a-zA-Z0-9_][\w./:-]{0,199})?$/.test(r.model)) &&
    (!(r.action === 'generate' || r.action === 'custom') || typeof r.instruction === 'string' && r.instruction.trim().length > 0);
}
