import React, { useState, useEffect, useRef } from 'react';
import { AssistantState, PersonaConfig, ReactionEvent, ThemeConfig, ToolCallData } from './types';
import { LiveSession } from './services/liveSession';
import { DEFAULT_THEME, getThemeByMood } from './utils/themePresets';
import { StatusHeader } from './components/StatusHeader';
import { OrbVisualizer } from './components/OrbVisualizer';
import { ControlBar } from './components/ControlBar';
import { CameraView } from './components/CameraView';
import { ReactionOverlay } from './components/ReactionOverlay';
import { ToolCallToast } from './components/ToolCallToast';
import { VoicePersonaModal } from './components/VoicePersonaModal';
import { AlertCircle, Camera, Eye } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [state, setState] = useState<AssistantState>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to talk');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeToolCall, setActiveToolCall] = useState<ToolCallData | null>(null);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [volume, setVolume] = useState<number>(1.0);

  const [persona, setPersona] = useState<PersonaConfig>({
    name: 'Roxy',
    voice: 'Aoede',
    vibe: 'sassy',
    customInstructions: '',
  });

  const sessionRef = useRef<LiveSession | null>(null);

  // Initialize LiveSession instance
  useEffect(() => {
    const session = new LiveSession(persona, {
      onStateChange: (newState) => {
        setState(newState);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onStatus: (status) => {
        setStatusMessage(status);
      },
      onToolCall: (call) => {
        setActiveToolCall(call);
      },
      onReaction: (reaction) => {
        setReactions((prev) => [...prev.slice(-4), reaction]);
      },
      onThemeChange: (mood) => {
        const newTheme = getThemeByMood(mood);
        setTheme(newTheme);
      },
      onCameraToggle: (enable) => {
        setIsCameraOpen((prev) => (enable !== undefined ? enable : !prev));
      },
    });

    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  const handleTogglePower = async () => {
    setErrorMessage(null);
    if (!sessionRef.current) return;

    if (state === 'disconnected') {
      try {
        await sessionRef.current.connect();
      } catch (err) {
        setErrorMessage('Failed to connect to Roxy. Please check microphone access.');
      }
    } else {
      sessionRef.current.disconnect();
    }
  };

  const handleToggleMute = () => {
    if (!sessionRef.current) return;
    const muted = sessionRef.current.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleCamera = () => {
    setIsCameraOpen((prev) => !prev);
  };

  const handleFrameCaptured = (base64Image: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendImageFrame(base64Image);
    }
  };

  const handleUpdatePersona = (newPersona: PersonaConfig) => {
    setPersona(newPersona);
    if (sessionRef.current) {
      sessionRef.current.updatePersona(newPersona);
    }
    // Update theme to match vibe if needed
    setTheme(getThemeByMood(newPersona.vibe));
  };

  const handleUpdateVolume = (vol: number) => {
    setVolume(vol);
    if (sessionRef.current) {
      sessionRef.current.getAudioStreamer().setVolume(vol);
    }
  };

  const handleDismissReaction = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  const streamer = sessionRef.current?.getAudioStreamer();
  const recorder = sessionRef.current?.getAudioRecorder();

  return (
    <main
      id="app-root"
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between text-white select-none transition-colors duration-700"
      style={{
        background: theme.bgGradient,
      }}
    >
      {/* Background Animated Vibrant Light Fields */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial-gradient from-[#ff2e8815] to-transparent opacity-40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-[#bc13fe15] via-transparent to-[#00f2ff15] blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-60" />
      </div>

      {/* Top Status Header */}
      <StatusHeader
        state={state}
        theme={theme}
        persona={persona}
        isCameraOpen={isCameraOpen}
        onThemeSelect={(themeId) => setTheme(getThemeByMood(themeId))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleCamera={handleToggleCamera}
      />

      {/* Camera View Window (Picture in Picture Live Vision) */}
      <CameraView
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onFrameCaptured={handleFrameCaptured}
        theme={theme}
        isConnected={state !== 'disconnected'}
      />

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md animate-fade-in">
          <div className="p-3 rounded-2xl bg-red-950/90 border border-red-500/50 backdrop-blur-xl text-red-200 text-xs flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-300 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Center Stage: Futuristic Orb Visualizer & Vibrant Sassy Typography */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-2">
        {streamer && recorder ? (
          <OrbVisualizer
            state={state}
            theme={theme}
            streamer={streamer}
            recorder={recorder}
            onOrbClick={handleTogglePower}
          />
        ) : null}

        {/* Vision Active Badge Indicator */}
        {isCameraOpen && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/30 backdrop-blur-md animate-pulse">
            <Eye className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="text-[11px] font-semibold text-[#00f2ff] tracking-wide uppercase">
              Roxy Eyes: Active (I see you!)
            </span>
          </div>
        )}

        {/* Dynamic Sassy Catchphrase & Status Headline */}
        <div className={`${isCameraOpen ? 'mt-3 sm:mt-5' : 'mt-8 sm:mt-12'} text-center z-10 max-w-lg px-4 select-none`}>
          <p className="text-[#ff2e88] font-medium text-sm sm:text-lg italic mb-1.5 opacity-90 transition-all duration-300">
            {state === 'speaking'
              ? '"Listen up babe, this is the tea..."'
              : isCameraOpen && state === 'listening'
              ? '"I can see you clearly babe! Show me what you’ve got going on or ask how you look 😉"'
              : state === 'listening'
              ? '"Oh, honey... are you going to say something smart, or should I just look fabulous?"'
              : state === 'connecting'
              ? '"Syncing our frequencies, hold onto your seat..."'
              : isCameraOpen
              ? '"Camera is ready! Start talking to show me everything."'
              : '"Ready when you are, darling. Don’t keep me waiting."'}
          </p>
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-white/90">
            {state === 'speaking'
              ? `${persona.name} is talking`
              : state === 'listening'
              ? isCameraOpen ? 'Roxy sees & hears you' : "I'm listening, darling."
              : state === 'connecting'
              ? 'Connecting link...'
              : 'Tap to start talking'}
          </h2>
        </div>
      </div>

      {/* Bottom Controls Dock */}
      <div className="relative z-20 w-full">
        <ControlBar
          state={state}
          theme={theme}
          isMuted={isMuted}
          isCameraOpen={isCameraOpen}
          onTogglePower={handleTogglePower}
          onToggleMute={handleToggleMute}
          onToggleCamera={handleToggleCamera}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectPrompt={(spark) => {}}
        />
      </div>

      {/* Interactive Tool Execution HUD Toast */}
      <ToolCallToast
        toolCall={activeToolCall}
        onClose={() => setActiveToolCall(null)}
      />

      {/* Sassy Reaction Particles Overlay */}
      <ReactionOverlay
        reactions={reactions}
        onDismiss={handleDismissReaction}
      />

      {/* Persona Customization Modal */}
      <VoicePersonaModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        persona={persona}
        theme={theme}
        volume={volume}
        onUpdatePersona={handleUpdatePersona}
        onUpdateVolume={handleUpdateVolume}
      />
    </main>
  );
}
