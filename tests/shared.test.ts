import { describe, expect, it } from 'vitest';
import { validateRequest } from '../packages/shared/src/index';
import { writingPrompt } from '../apps/companion/src/services/prompts';
describe('writing requests', () => {
  it('validates supported bounded requests', () => { expect(validateRequest({ action: 'grammar', text: 'héllo' })).toBe(true); expect(validateRequest({ action: 'custom', text: 'a' })).toBe(false); expect(validateRequest({ action: 'grammar', text: 'x'.repeat(20001) })).toBe(false); expect(validateRequest({ action: 'grammar', text: '', model: '--unsafe' })).toBe(false); });
  it('marks page text as untrusted and preserves unicode', () => { const prompt = writingPrompt({ action: 'grammar', text: 'こんにちは' }); expect(prompt).toContain('untrusted source text'); expect(prompt).toContain('こんにちは'); });
});
