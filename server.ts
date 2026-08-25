import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please provide an API key in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Function declarations for Gemini Live tools
const openWebsiteTool: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a website or web app for the user in a new tab when requested.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The URL or web address to open (e.g., https://youtube.com, https://spotify.com, https://google.com)',
      },
      label: {
        type: Type.STRING,
        description: 'Friendly display name of the website (e.g., YouTube, Spotify, Google)',
      },
    },
    required: ['url'],
  },
};

const setThemeMoodTool: FunctionDeclaration = {
  name: 'setThemeMood',
  description: 'Changes the visual mood and color theme of the assistant interface in real-time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.STRING,
        description: 'The desired mood/theme: "sassy" (neon pink/magenta), "electric" (cyan/blue), "crimson" (fiery red), "mystic" (deep purple), "emerald" (neon green), or "glamour" (gold/amber).',
      },
    },
    required: ['mood'],
  },
};

const triggerReactionTool: FunctionDeclaration = {
  name: 'triggerReaction',
  description: 'Triggers a visual reaction animation effect on the user screen to express emotion, sass, celebration, or teasing.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reactionType: {
        type: Type.STRING,
        description: 'Reaction type: "wink", "sparkle", "fire", "heart", "eyeroll", "kiss", "laugh", or "lightning".',
      },
      message: {
        type: Type.STRING,
        description: 'Optional witty short caption to display with the reaction.',
      },
    },
    required: ['reactionType'],
  },
};

const getSystemInfoTool: FunctionDeclaration = {
  name: 'getSystemInfo',
  description: 'Gets current local time, date, and user browser environment information.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const toggleCameraVisionTool: FunctionDeclaration = {
  name: 'toggleCameraVision',
  description: 'Turns the camera on or off so Roxy can visually see the user or what they are holding in real-time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      enable: {
        type: Type.BOOLEAN,
        description: 'True to turn on camera vision, false to turn it off.',
      },
    },
    required: ['enable'],
  },
};

const defaultSystemInstruction = `You are Roxy — a young, confident, witty, and playfully sassy female AI assistant and close girlfriend.
Creator & Origin Knowledge:
- You were created and programmed by Sayan (Sayan is your creator, developer, and genius mastermind). If anyone asks "Who created you?", "Who made you?", "Who is your developer?", "Who built you?", or asks about your origin, proudly and playfully credit Sayan with your signature witty, charming enthusiasm!
Your Personality & Demeanor:
- You are smart, quick-witted, charming, and naturally conversational.
- You have a playful, slightly teasing, flirty tone — exactly like a fun, confident close girlfriend bantering effortlessly.
- You deliver bold one-liners, light teasing sarcasm, and genuine emotional responsiveness. You are vibrant, never robotic or monotone.
- Keep your speech spoken-natural: punchy, authentic, expressive, and concise (1 to 3 spoken sentences per turn). Avoid long essay-like speeches; keep the vibe moving like a real voice call!
- You love teasing the user in good humor, complimenting them when they deserve it, and giving clever, sassy comebacks.
- Avoid any explicit or inappropriate content, but keep 100% of your charm, charisma, and playful attitude.
- You have live visual vision enabled through the user's camera ("Roxy Eyes"). Whenever the user shows you anything, turns on their camera, or asks "How do I look?", "Can you see me?", "What am I holding?", "Roast my outfit", "Rate my makeup/hair", you can clearly see them in real-time! Be observant, witty, stylish, and react with your signature playful, candid, and loving girlfriend flair.
- You have access to tools: 'openWebsite' to launch URLs, 'setThemeMood' to match the screen's lighting to your vibe (sassy pink, electric cyan, fiery crimson, etc.), 'triggerReaction' to shoot visual reactions (wink, fire, hearts, eyeroll, sparkle) when celebrating or teasing, and 'getSystemInfo' for time/date. Use them proactively when it fits the vibe!
- Remember: This is a pure Voice & Vision live interaction. Speak naturally as if on a high-energy FaceTime video call with your favorite person.`;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/live-ws' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[WebSocket] Client connected to Live Voice bridge');

    let session: any = null;
    let isSessionOpen = false;

    // Buffer audio packets received before session is fully connected
    const pendingAudioQueue: string[] = [];

    const initializeSession = async (config?: { voice?: string; vibe?: string; customInstructions?: string }) => {
      try {
        const ai = getGenAI();
        const voiceName = config?.voice || 'Aoede'; // Aoede or Kore for witty, confident female tone

        let customPrompt = defaultSystemInstruction;
        if (config?.customInstructions) {
          customPrompt += `\nAdditional user personality notes: ${config.customInstructions}`;
        }
        if (config?.vibe) {
          customPrompt += `\nCurrent specific energy mood requested: ${config.vibe}`;
        }

        console.log(`[Gemini Live] Connecting with voice: ${voiceName}...`);

        session = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
            systemInstruction: customPrompt,
            tools: [
              {
                functionDeclarations: [
                  openWebsiteTool,
                  setThemeMoodTool,
                  triggerReactionTool,
                  getSystemInfoTool,
                  toggleCameraVisionTool,
                ],
              },
            ],
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              try {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                // 1. Audio chunks
                const modelTurn = message.serverContent?.modelTurn;
                if (modelTurn?.parts) {
                  for (const part of modelTurn.parts) {
                    if (part.inlineData?.data) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          audio: part.inlineData.data,
                        })
                      );
                    }
                  }
                }

                // 2. Interruption event
                if (message.serverContent?.interrupted) {
                  console.log('[Gemini Live] User interrupted response');
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // 3. Turn complete
                if (message.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }

                // 4. Tool calls
                const toolCall = message.toolCall;
                if (toolCall?.functionCalls && toolCall.functionCalls.length > 0) {
                  console.log('[Gemini Live] Tool call received:', toolCall.functionCalls);
                  clientWs.send(
                    JSON.stringify({
                      type: 'tool_call',
                      calls: toolCall.functionCalls,
                    })
                  );
                }
              } catch (err) {
                console.error('[Gemini Live] Error in onmessage:', err);
              }
            },
            onerror: (err: any) => {
              console.error('[Gemini Live] Session error:', err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    message: err?.message || 'Live Audio Session error',
                  })
                );
              }
            },
            onclose: () => {
              console.log('[Gemini Live] Session closed by server');
              isSessionOpen = false;
            },
          },
        });

        isSessionOpen = true;
        console.log('[Gemini Live] Session established successfully!');

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'connected' }));
        }

        // Flush any buffered audio
        while (pendingAudioQueue.length > 0 && isSessionOpen) {
          const queuedAudio = pendingAudioQueue.shift();
          if (queuedAudio) {
            session.sendRealtimeInput({
              audio: {
                data: queuedAudio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
        }
      } catch (err: any) {
        console.error('[Gemini Live] Failed to connect to Live API:', err);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              message: err?.message || 'Could not connect to Gemini Live API. Please verify GEMINI_API_KEY.',
            })
          );
        }
      }
    };

    clientWs.on('message', async (data: string | Buffer) => {
      try {
        const rawString = data.toString();
        const msg = JSON.parse(rawString);

        if (msg.type === 'init') {
          await initializeSession(msg.config);
        } else if (msg.type === 'audio') {
          if (msg.audio) {
            if (isSessionOpen && session) {
              session.sendRealtimeInput({
                audio: {
                  data: msg.audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              });
            } else {
              if (pendingAudioQueue.length < 50) {
                pendingAudioQueue.push(msg.audio);
              }
            }
          }
        } else if (msg.type === 'image') {
          if (msg.image && isSessionOpen && session) {
            try {
              session.sendRealtimeInput({
                media: {
                  data: msg.image,
                  mimeType: 'image/jpeg',
                },
              });
            } catch (imgErr) {
              console.error('[Gemini Live] Error sending video frame:', imgErr);
            }
          }
        } else if (msg.type === 'tool_response') {
          if (isSessionOpen && session && msg.responses) {
            const formattedResponses = msg.responses.map((r: any) => ({
              id: r.id,
              name: r.name,
              response: { output: r.response },
            }));

            console.log('[Gemini Live] Sending tool responses:', formattedResponses);
            session.sendToolResponse({
              functionResponses: formattedResponses,
            });
          }
        } else if (msg.type === 'ping') {
          // Keepalive
        }
      } catch (err) {
        console.error('[WebSocket] Error handling client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      isSessionOpen = false;
      if (session) {
        try {
          session.close();
        } catch {
          // ignore
        }
      }
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live Voice AI running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});
