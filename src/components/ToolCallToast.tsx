import React, { useEffect, useState } from 'react';
import { ExternalLink, Palette, Activity, Info, X } from 'lucide-react';
import { ToolCallData } from '../types';

interface ToolCallToastProps {
  toolCall: ToolCallData | null;
  onClose: () => void;
}

export const ToolCallToast: React.FC<ToolCallToastProps> = ({ toolCall, onClose }) => {
  useEffect(() => {
    if (!toolCall) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toolCall, onClose]);

  if (!toolCall) return null;

  const renderContent = () => {
    if (toolCall.name === 'openWebsite') {
      const url = String(toolCall.args.url || '');
      const label = String(toolCall.args.label || url);
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Opening Website</p>
              <p className="text-[11px] text-white/60 truncate max-w-[200px]">{label}</p>
            </div>
          </div>
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold bg-[#00f2ff] hover:bg-cyan-300 text-black rounded-xl transition-all shadow-[0_0_10px_rgba(0,242,255,0.4)]"
          >
            Visit
          </a>
        </div>
      );
    }

    if (toolCall.name === 'setThemeMood') {
      const mood = String(toolCall.args.mood || 'sassy');
      return (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#ff2e88]/20 text-[#ff2e88] border border-[#ff2e88]/30 shadow-[0_0_10px_rgba(255,46,136,0.2)]">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Vibe Shift Triggered</p>
            <p className="text-[11px] text-white/60 capitalize">Switched mood to {mood}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-[#bc13fe]/20 text-[#bc13fe] border border-[#bc13fe]/30 shadow-[0_0_10px_rgba(188,19,254,0.2)]">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Action Executed</p>
          <p className="text-[11px] text-white/60">{toolCall.name}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-40 animate-slide-in">
      <div className="p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex-1">{renderContent()}</div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
