import React, { useEffect, useState } from 'react';
import { Sparkles, Radio, Camera, CameraOff, Eye } from 'lucide-react';
import { AssistantState, PersonaConfig, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../utils/themePresets';

interface StatusHeaderProps {
  state: AssistantState;
  theme: ThemeConfig;
  persona: PersonaConfig;
  isCameraOpen?: boolean;
  onThemeSelect: (themeId: string) => void;
  onOpenSettings: () => void;
  onToggleCamera?: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  state,
  theme,
  persona,
  isCameraOpen = false,
  onThemeSelect,
  onOpenSettings,
  onToggleCamera,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let interval: number;
    if (state !== 'disconnected') {
      interval = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const ms = Math.floor((totalSeconds * 13) % 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const nameFirstPart = persona.name.slice(0, Math.ceil(persona.name.length / 2)).toUpperCase();
  const nameSecondPart = persona.name.slice(Math.ceil(persona.name.length / 2)).toUpperCase();

  return (
    <header className="w-full max-w-5xl mx-auto flex justify-between items-center px-6 py-5 z-20">
      {/* Brand & Persona Badge */}
      <div className="flex items-center gap-4 cursor-pointer" onClick={onOpenSettings} title="Customize Persona & Settings">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff2e88] to-[#bc13fe] flex items-center justify-center shadow-[0_0_20px_rgba(255,46,136,0.4)] transition-transform hover:scale-105">
          <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
            {nameFirstPart}<span className="text-[#ff2e88]">{nameSecondPart || 'A'}</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 mt-1 flex items-center gap-1.5">
            <span>Voice & Vision</span>
            <span className="text-white/20">•</span>
            <span className="text-[#ff2e88] font-semibold lowercase tracking-normal">by Sayan</span>
          </p>
        </div>
      </div>

      {/* Session Metadata & Gemini Status Badge */}
      <div className="flex gap-4 sm:gap-6 items-center">
        {/* Live Session Time */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Session Time</span>
          <span className="text-sm sm:text-base font-mono text-white/90 font-semibold tracking-wider">
            {state !== 'disconnected' ? formatTimer(secondsElapsed) : '00:00.00'}
          </span>
        </div>

        {/* Gemini 3.1 Live Spec Pill */}
        <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shadow-[0_0_8px_#00f2ff] transition-colors"
            style={{
              backgroundColor:
                state === 'speaking'
                  ? '#ff2e88'
                  : state === 'listening'
                  ? '#00f2ff'
                  : state === 'connecting'
                  ? '#f59e0b'
                  : state === 'idle'
                  ? '#10b981'
                  : '#475569',
              boxShadow:
                state === 'speaking'
                  ? '0 0 10px #ff2e88'
                  : state === 'listening'
                  ? '0 0 10px #00f2ff'
                  : undefined,
            }}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Gemini 3.1 Flash
          </span>
        </div>

        {/* Header Camera Vision Quick Toggle Button */}
        {onToggleCamera && (
          <button
            onClick={onToggleCamera}
            title={isCameraOpen ? 'Turn off Roxy Eyes' : 'Turn on Roxy Eyes (Live Camera)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              isCameraOpen
                ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)] animate-pulse'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/40 hover:text-[#00f2ff]'
            }`}
          >
            {isCameraOpen ? (
              <>
                <Camera className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>Roxy Eyes: ON</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Enable Eyes</span>
              </>
            )}
          </button>
        )}

        {/* Quick Theme Presets */}
        <div className="hidden md:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          {Object.values(THEME_PRESETS).map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeSelect(t.id)}
              title={`Switch vibe to ${t.name}`}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${
                theme.id === t.id
                  ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,46,136,0.6)]'
                  : 'opacity-50 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: t.primaryColor }}
            />
          ))}
        </div>
      </div>
    </header>
  );
};

