import {
  AssistantState,
  ClientToServerMessage,
  PersonaConfig,
  ReactionEvent,
  ServerToClientMessage,
  ToolCallData,
  ToolResponseData,
} from '../types';
import { AudioRecorder } from './audioRecorder';
import { AudioStreamer } from './audioStreamer';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onError: (error: string) => void;
  onStatus: (status: string) => void;
  onToolCall: (call: ToolCallData) => void;
  onReaction: (reaction: ReactionEvent) => void;
  onThemeChange?: (themeId: string) => void;
  onCameraToggle?: (enable?: boolean) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private streamer: AudioStreamer;
  private recorder: AudioRecorder;
  private state: AssistantState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private persona: PersonaConfig;
  private pingInterval: number | null = null;
  private isUserSpeaking: boolean = false;
  private isModelSpeaking: boolean = false;

  constructor(persona: PersonaConfig, callbacks: LiveSessionCallbacks) {
    this.persona = persona;
    this.callbacks = callbacks;
    this.streamer = new AudioStreamer(24000);
    this.recorder = new AudioRecorder();

    this.streamer.setOnStateChange((isPlaying) => {
      this.isModelSpeaking = isPlaying;
      this.updateComputedState();
    });

    this.recorder.setOnUserSpeaking((speaking) => {
      this.isUserSpeaking = speaking;
      this.updateComputedState();
    });
  }

  public updatePersona(newPersona: PersonaConfig): void {
    this.persona = newPersona;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'init',
          config: this.persona,
        } as ClientToServerMessage)
      );
    }
  }

  public getAudioStreamer(): AudioStreamer {
    return this.streamer;
  }

  public getAudioRecorder(): AudioRecorder {
    return this.recorder;
  }

  public getState(): AssistantState {
    return this.state;
  }

  private setState(newState: AssistantState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  private updateComputedState(): void {
    if (this.state === 'disconnected' || this.state === 'connecting') {
      return;
    }

    if (this.isModelSpeaking) {
      this.setState('speaking');
    } else if (this.isUserSpeaking) {
      this.setState('listening');
    } else {
      this.setState('idle');
    }
  }

  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'idle' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.setState('connecting');
    this.callbacks.onStatus('Connecting to Roxy...');

    try {
      // 1. Initialize audio streamer (Web Audio output)
      this.streamer.init();

      // 2. Open WebSocket to backend
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.callbacks.onStatus('Establishing voice session...');
        // Send initial persona configuration
        this.ws?.send(
          JSON.stringify({
            type: 'init',
            config: this.persona,
          } as ClientToServerMessage)
        );

        // Start ping interval
        this.pingInterval = window.setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);

        // Start recording mic
        try {
          await this.recorder.start((base64Chunk) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(
                JSON.stringify({
                  type: 'audio',
                  audio: base64Chunk,
                } as ClientToServerMessage)
              );
            }
          });

          this.setState('idle');
          this.callbacks.onStatus('Roxy is listening. Speak freely!');
        } catch (micErr) {
          console.error('[LiveSession] Mic error:', micErr);
          this.callbacks.onError('Microphone access is required. Please grant mic permission.');
          this.disconnect();
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg: ServerToClientMessage = JSON.parse(event.data);

          if (msg.type === 'connected') {
            this.setState('idle');
            this.callbacks.onStatus('Roxy connected and ready!');
          } else if (msg.type === 'audio' && msg.audio) {
            this.streamer.addPCM16Chunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            // User interrupted the model
            this.streamer.stopAndClearQueue();
            this.setState('listening');
            this.callbacks.onStatus('Interrupted — listening to you');
          } else if (msg.type === 'tool_call' && msg.calls) {
            await this.handleToolCalls(msg.calls);
          } else if (msg.type === 'status' && msg.status) {
            this.callbacks.onStatus(msg.status);
          } else if (msg.type === 'error') {
            this.callbacks.onError(msg.message || 'Unknown voice engine error');
          }
        } catch (err) {
          console.error('[LiveSession] Failed to parse server message:', err);
        }
      };

      this.ws.onerror = (evt) => {
        console.error('[LiveSession] WebSocket error:', evt);
        this.callbacks.onError('Connection error. Check your network or API Key.');
      };

      this.ws.onclose = () => {
        this.handleClose();
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.callbacks.onError(`Connection failed: ${errorMsg}`);
      this.disconnect();
    }
  }

  private async handleToolCalls(calls: ToolCallData[]): Promise<void> {
    const responses: ToolResponseData[] = [];

    for (const call of calls) {
      this.callbacks.onToolCall(call);
      const args = call.args || {};

      try {
        if (call.name === 'openWebsite') {
          const rawUrl = String(args.url || '');
          const label = String(args.label || rawUrl);
          let targetUrl = rawUrl;
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
          }

          // Try window.open
          try {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          } catch {
            // In iframe sandbox, window.open might be restricted
          }

          responses.push({
            id: call.id,
            name: call.name,
            response: {
              success: true,
              message: `Opened ${label} at ${targetUrl}`,
              openedUrl: targetUrl,
            },
          });
        } else if (call.name === 'setThemeMood') {
          const mood = String(args.mood || 'sassy').toLowerCase();
          this.callbacks.onThemeChange?.(mood);
          responses.push({
            id: call.id,
            name: call.name,
            response: {
              success: true,
              appliedMood: mood,
              message: `Switched mood/theme to ${mood}`,
            },
          });
        } else if (call.name === 'triggerReaction') {
          const reactionType = (String(args.reactionType || 'sparkle').toLowerCase() as unknown) as ReactionEvent['type'];
          const message = String(args.message || '');
          this.callbacks.onReaction({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: reactionType,
            message,
            timestamp: Date.now(),
          });
          responses.push({
            id: call.id,
            name: call.name,
            response: {
              success: true,
              reaction: reactionType,
            },
          });
        } else if (call.name === 'getSystemInfo') {
          const time = new Date().toLocaleTimeString();
          const date = new Date().toLocaleDateString();
          responses.push({
            id: call.id,
            name: call.name,
            response: {
              localTime: time,
              localDate: date,
              browser: navigator.userAgent,
              online: navigator.onLine,
            },
          });
        } else if (call.name === 'toggleCameraVision') {
          const enable = args.enable !== undefined ? Boolean(args.enable) : true;
          this.callbacks.onCameraToggle?.(enable);
          responses.push({
            id: call.id,
            name: call.name,
            response: {
              success: true,
              cameraEnabled: enable,
              message: enable
                ? 'Camera vision opened. Roxy can now visually see the user in real-time.'
                : 'Camera vision turned off.',
            },
          });
        } else {
          responses.push({
            id: call.id,
            name: call.name,
            response: {
              status: 'executed',
              args,
            },
          });
        }
      } catch (err) {
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            error: String(err),
          },
        });
      }
    }

    // Send tool responses back to the Live Session
    if (this.ws?.readyState === WebSocket.OPEN && responses.length > 0) {
      this.ws.send(
        JSON.stringify({
          type: 'tool_response',
          responses,
        } as ClientToServerMessage)
      );
    }
  }

  private handleClose(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.streamer.stopAndClearQueue();
    this.recorder.stop();
    this.setState('disconnected');
    this.callbacks.onStatus('Session disconnected');
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handleClose();
  }

  public toggleMute(): boolean {
    return this.recorder.toggleMute();
  }

  public isMuted(): boolean {
    return this.recorder.isMicrophoneMuted();
  }

  public sendImageFrame(base64Image: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && base64Image) {
      this.ws.send(
        JSON.stringify({
          type: 'image',
          image: base64Image,
        } as ClientToServerMessage)
      );
    }
  }
}
