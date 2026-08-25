import React, { useState } from 'react';
import { X, Sparkles, Volume2, Flame, Heart, Smile, Cpu } from 'lucide-react';
import { PersonaConfig, VoiceName, ThemeConfig } from '../types';

interface VoicePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaConfig;
  theme: ThemeConfig;
  volume: number;
  onUpdatePersona: (newPersona: PersonaConfig) => void;
  onUpdateVolume: (vol: number) => void;
}

const VOICES: { id: VoiceName; label: string; desc: string }[] = [
  { id: 'Aoede', label: 'Aoede (Recommended)', desc: 'Melodic, youthful, confident and sassy' },
  { id: 'Kore', label: 'Kore', desc: 'Warm, expressive, natural conversational style' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Bright, punchy, energetic banter' },
  { id: 'Puck', label: 'Puck', desc: 'Playful, animated, quick-witted' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Bold, deep, charismatic presence' },
];

const VIBES = [
  { id: 'sassy', label: 'Sassy & Teasing', icon: Flame, desc: 'Witty comebacks, playful roast, bold attitude' },
  { id: 'flirty', label: 'Flirty & Charming', icon: Heart, desc: 'Sweet compliments, playful teasing, close girlfriend energy' },
  { id: 'witty', label: 'Quick-Witted & Smart', icon: Sparkles, desc: 'Sharp humor, clever observations, intelligent dialogue' },
  { id: 'cyberpunk', label: 'Cyberpunk Rebel', icon: Cpu, desc: 'Futuristic swagger, edgy charm, neon aesthetic' },
  { id: 'chill', label: 'Chill & Casual', icon: Smile, desc: 'Relaxed, supportive, laid-back casual chat' },
];

export const VoicePersonaModal: React.FC<VoicePersonaModalProps> = ({
  isOpen,
  onClose,
  persona,
  theme,
  volume,
  onUpdatePersona,
  onUpdateVolume,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(persona.voice);
  const [selectedVibe, setSelectedVibe] = useState(persona.vibe);
  const [name, setName] = useState(persona.name);
  const [customInstructions, setCustomInstructions] = useState(persona.customInstructions || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdatePersona({
      name,
      voice: selectedVoice,
      vibe: selectedVibe as any,
      customInstructions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#08080a] border border-white/15 p-6 shadow-[0_0_50px_rgba(255,46,136,0.2)] text-white flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff2e88] to-[#bc13fe] flex items-center justify-center shadow-[0_0_20px_rgba(255,46,136,0.4)]">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Voice Persona & Vibe</h2>
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <span>Customize live speech profile</span>
                <span className="text-white/20">•</span>
                <span className="text-[#ff2e88] font-medium">Created by Sayan</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* Assistant Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Assistant Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff2e88] focus:outline-none text-sm text-white"
              placeholder="Roxy"
            />
          </div>

          {/* Vibe Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Attitude & Persona Vibe
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIBES.map((v) => {
                const Icon = v.icon;
                const isSelected = selectedVibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVibe(v.id as any)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#ff2e88]/15 border-[#ff2e88] shadow-[0_0_15px_rgba(255,46,136,0.25)] text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#ff2e88]' : 'text-white/40'}`} />
                    <div>
                      <p className="text-xs font-bold leading-none mb-1">{v.label}</p>
                      <p className="text-[10px] text-white/50 leading-tight">{v.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Gemini Live Voice Profile
            </label>
            <div className="space-y-1.5">
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#bc13fe]/20 border-[#bc13fe] text-white shadow-[0_0_15px_rgba(188,19,254,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{v.label}</p>
                      <p className="text-[11px] text-white/50">{v.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff2e88] shadow-[0_0_8px_#ff2e88]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Persona Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Custom Persona Notes / Directives
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always keep banter high-energy and call me darling..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff2e88] focus:outline-none text-xs text-white placeholder-white/30"
            />
          </div>

          {/* Audio Output Volume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-white/50" />
                Assistant Master Volume
              </label>
              <span className="text-xs font-mono text-[#00f2ff]">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
              className="w-full accent-[#ff2e88] cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-[#ff2e88] to-[#bc13fe] hover:opacity-90 text-white rounded-xl shadow-[0_0_20px_rgba(255,46,136,0.3)] transition-all active:scale-95"
          >
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};

