import type { WritingRequest } from '@kiko/shared';
export interface AgentStatus { available: boolean; message: string }
export type WritingEvent = { type: 'text'; text: string } | { type: 'error'; message: string } | { type: 'done' };
export interface AgentAdapter { id: string; name: string; detect(): Promise<boolean>; getStatus(): Promise<AgentStatus>; generate(request: WritingRequest, signal?: AbortSignal): AsyncIterable<WritingEvent> }
