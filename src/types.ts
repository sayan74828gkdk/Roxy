export type AssistantState = 'disconnected' | 'connecting' | 'idle' | 'listening' | 'speaking' | 'interrupted';

export type VoiceName = 'Aoede' | 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck';

export interface PersonaConfig {
  name: string;
  voice: VoiceName;
  vibe: 'sassy' | 'flirty' | 'witty' | 'cyberpunk' | 'chill';
  customInstructions?: string;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResponseData {
  id: string;
  name?: string;
  response: Record<string, unknown>;
}

export type ReactionType = 'heart' | 'sparkle' | 'fire' | 'wink' | 'eyeroll' | 'kiss' | 'laugh' | 'lightning';

export interface ReactionEvent {
  id: string;
  type: ReactionType;
  message?: string;
  timestamp: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  glowColor: string;
  accentColor: string;
  bgGradient: string;
  particleColor: string;
}

export interface ServerToClientMessage {
  type: 'connected' | 'audio' | 'interrupted' | 'tool_call' | 'status' | 'error' | 'turn_complete';
  audio?: string;
  calls?: ToolCallData[];
  status?: string;
  message?: string;
}

export interface ClientToServerMessage {
  type: 'init' | 'audio' | 'image' | 'tool_response' | 'interrupt' | 'ping';
  config?: PersonaConfig;
  audio?: string;
  image?: string;
  responses?: ToolResponseData[];
}
