import React, { useEffect, useState } from 'react';
import { ReactionEvent } from '../types';
import { Heart, Sparkles, Flame, Zap, Smile, ThumbsUp, Laugh, MessageCircle } from 'lucide-react';

interface ReactionOverlayProps {
  reactions: ReactionEvent[];
  onDismiss: (id: string) => void;
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({
  reactions,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {reactions.map((r) => (
        <ReactionParticle key={r.id} reaction={r} onEnd={() => onDismiss(r.id)} />
      ))}
    </div>
  );
};

const ReactionParticle: React.FC<{ reaction: ReactionEvent; onEnd: () => void }> = ({
  reaction,
  onEnd,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onEnd();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onEnd]);

  const renderIcon = () => {
    switch (reaction.type) {
      case 'heart':
      case 'kiss':
        return <Heart className="w-12 h-12 text-rose-500 fill-rose-500" />;
      case 'fire':
        return <Flame className="w-12 h-12 text-amber-500 fill-amber-500" />;
      case 'lightning':
        return <Zap className="w-12 h-12 text-cyan-400 fill-cyan-400" />;
      case 'laugh':
        return <Laugh className="w-12 h-12 text-yellow-400" />;
      case 'wink':
        return (
          <div className="text-5xl select-none filter drop-shadow-lg">
            😉
          </div>
        );
      case 'eyeroll':
        return (
          <div className="text-5xl select-none filter drop-shadow-lg">
            🙄
          </div>
        );
      case 'sparkle':
      default:
        return <Sparkles className="w-12 h-12 text-yellow-300 fill-yellow-300" />;
    }
  };

  return (
    <div className="absolute flex flex-col items-center justify-center animate-bounce duration-1000">
      <div className="relative p-4 rounded-3xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center gap-2 transform transition-all animate-pulse">
        {renderIcon()}
        {reaction.message && (
          <span className="text-sm font-bold text-white tracking-wide px-3 py-1 rounded-full bg-white/10 border border-white/10">
            {reaction.message}
          </span>
        )}
      </div>
    </div>
  );
};
