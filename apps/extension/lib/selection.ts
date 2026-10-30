export type TextField = HTMLInputElement | HTMLTextAreaElement;
export interface Snapshot { field: TextField; value: string; start: number; end: number; text: string }
export function isTextField(el: EventTarget | null): el is TextField {
  if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly;
  if (!(el instanceof HTMLInputElement) || el.disabled || el.readOnly) return false;
  if (!['text', 'search'].includes(el.type)) return false;
  const sensitive = `${el.autocomplete} ${el.name} ${el.id}`;
  return !/(password|passcode|credit.card|cc-|card.number|cvc|cvv|social.security|ssn|one.time|otp)/i.test(sensitive);
}
export function capture(field: TextField): Snapshot {
  const value = field.value; const selectionStart = field.selectionStart ?? 0; const selectionEnd = field.selectionEnd ?? 0;
  const start = selectionStart === selectionEnd ? 0 : selectionStart; const end = selectionStart === selectionEnd ? value.length : selectionEnd;
  return { field, value, start, end, text: value.slice(start, end) };
}
export function replace(snapshot: Snapshot, text: string): boolean {
  const { field, value, start, end } = snapshot;
  if (!field.isConnected || field.value !== value) return false;
  const next = value.slice(0, start) + text + value.slice(end);
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, next);
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  field.focus(); field.setSelectionRange(start + text.length, start + text.length); return true;
}
