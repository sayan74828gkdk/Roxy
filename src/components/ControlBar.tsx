import React from 'react';
import { Mic, MicOff, Sliders, RefreshCw, Camera, CameraOff } from 'lucide-react';
import { AssistantState, ThemeConfig } from '../types';

interface ControlBarProps {
  state: AssistantState;
  theme: ThemeConfig;
  isMuted: boolean;
  isCameraOpen: boolean;
  onTogglePower: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onOpenSettings: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  state,
  theme,
  isMuted,
  isCameraOpen,
  onTogglePower,
  onToggleMute,
  onToggleCamera,
  onOpenSettings,
}) => {
  const isConnected = state !== 'disconnected';

  return (
    <div id="control-bar" className="w-full z-20 bg-white/5 backdrop-blur-md border-t border-white/10 px-4 sm:px-12 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
        {/* Left: Glass Quick Action Controls */}
        <div className="flex gap-3 sm:gap-5 items-center">
          {/* Settings / Persona */}
          <div className="group cursor-pointer flex flex-col items-center" onClick={onOpenSettings} title="Voice & Persona Settings">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 transition-all duration-200 group-hover:bg-[#ff2e8810] group-hover:border-[#ff2e8850] group-active:scale-95">
              <Sliders className="w-5 h-5 text-white/70 group-hover:text-[#ff2e88] transition-colors" />
            </div>
            <p className="text-[10px] mt-1.5 text-center uppercase tracking-wider text-white/40 font-medium">Persona</p>
          </div>

          {/* Camera (Roxy Vision) Toggle */}
          <div
            className="group cursor-pointer flex flex-col items-center"
            onClick={onToggleCamera}
            title={isCameraOpen ? 'Turn Off Camera Vision' : 'Turn On Camera Vision (Roxy Sees You)'}
          >
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 ${
                isCameraOpen
                  ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/70 group-hover:bg-[#00f2ff10] group-hover:border-[#00f2ff50] group-hover:text-[#00f2ff]'
              } group-active:scale-95`}
            >
              {isCameraOpen ? (
                <Camera className="w-5 h-5 text-[#00f2ff] animate-pulse" />
              ) : (
                <CameraOff className="w-5 h-5 text-white/60 group-hover:text-[#00f2ff]" />
              )}
            </div>
            <p className="text-[10px] mt-1.5 text-center uppercase tracking-wider text-white/40 font-medium flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isCameraOpen ? 'bg-[#00f2ff]' : 'bg-white/20'}`} />
              Vision
            </p>
          </div>

          {/* Mute Toggle */}
          <div
            className={`group flex flex-col items-center ${!isConnected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={isConnected ? onToggleMute : undefined}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-white/5 border-white/10 text-white/70 group-hover:bg-[#ff2e8810] group-hover:border-[#ff2e8850] group-hover:text-[#ff2e88]'
              } group-active:scale-95`}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />}
            </div>
            <p className="text-[10px] mt-1.5 text-center uppercase tracking-wider text-white/40 font-medium">
              {isMuted ? 'Muted' : 'Mic'}
            </p>
          </div>
        </div>

        {/* Center: Vibrant Glowing Power Button */}
        <div className="flex justify-center">
          <div
            id="btn-power-main"
            className="relative group cursor-pointer"
            onClick={onTogglePower}
            title={isConnected ? 'Disconnect Live Session' : 'Start Voice Live Session'}
          >
            {/* Ambient Vibrant Aura Blur */}
            <div
              className={`absolute inset-0 bg-[#ff2e88] blur-2xl transition-opacity duration-500 ${
                isConnected ? 'opacity-40 animate-pulse' : 'opacity-15 group-hover:opacity-35'
              }`}
            />

            {/* Glowing Action Circle */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-4 border-black transition-transform duration-300 shadow-[0_0_40px_rgba(255,46,136,0.4)] ${
                isConnected
                  ? 'bg-[#ff2e88] group-hover:scale-105 active:scale-95'
                  : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-black group-hover:bg-[#ff2e88] group-hover:text-white group-hover:scale-105 active:scale-95'
              }`}
            >
              {state === 'connecting' ? (
                <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-white" />
              ) : isConnected ? (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1 h-6 sm:h-8 bg-white rounded-full animate-pulse" />
                  <div className="w-1 h-8 sm:h-10 bg-white rounded-full" />
                  <div className="w-1 h-6 sm:h-8 bg-white rounded-full animate-pulse" />
                </div>
              ) : (
                <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Right: Active Tool Telemetry */}
        <div className="flex justify-end gap-3 sm:gap-4 items-center">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Active Interface</p>
            <p className="text-xs sm:text-sm text-[#00f2ff] font-semibold uppercase tracking-wide truncate max-w-[140px]">
              {state === 'speaking'
                ? 'Roxy Speaking'
                : state === 'listening'
                ? isCameraOpen ? 'Voice & Vision' : 'Live Mic'
                : state === 'connecting'
                ? 'Web Audio 24kHz'
                : isCameraOpen ? 'Vision Ready' : 'Standby Core'}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#00f2ff10] border border-[#00f2ff40] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.15)]">
            <div
              className="w-3.5 h-3.5 rounded-sm transition-all"
              style={{
                backgroundColor: isConnected ? '#00f2ff' : '#475569',
                boxShadow: isConnected ? '0 0 10px #00f2ff' : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

