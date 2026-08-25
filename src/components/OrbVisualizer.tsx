import React, { useEffect, useRef } from 'react';
import { AssistantState, ThemeConfig } from '../types';
import { AudioRecorder } from '../services/audioRecorder';
import { AudioStreamer } from '../services/audioStreamer';

interface OrbVisualizerProps {
  state: AssistantState;
  theme: ThemeConfig;
  streamer: AudioStreamer;
  recorder: AudioRecorder;
  onOrbClick: () => void;
}

export const OrbVisualizer: React.FC<OrbVisualizerProps> = ({
  state,
  theme,
  streamer,
  recorder,
  onOrbClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;
    let pulsePhase = 0;

    const dataArray = new Uint8Array(64);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.26;

      let audioLevel = 0;
      if (state === 'speaking') {
        streamer.getFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        audioLevel = sum / 32 / 255;
      } else if (state === 'listening') {
        recorder.getFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        audioLevel = sum / 32 / 255;
      }

      pulsePhase += 0.04 + audioLevel * 0.08;
      rotationAngle += 0.01 + audioLevel * 0.03;

      const dynamicRadius = baseRadius + Math.sin(pulsePhase) * 5 + audioLevel * baseRadius * 0.4;

      // 1. Ambient Vibrant Multi-Color Aura
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.3,
        centerX,
        centerY,
        dynamicRadius * 2.4
      );
      outerGlow.addColorStop(0, 'rgba(255, 46, 136, 0.35)');
      outerGlow.addColorStop(0.4, 'rgba(188, 19, 254, 0.2)');
      outerGlow.addColorStop(0.7, 'rgba(0, 242, 255, 0.1)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Dashed Outer Holographic Rings
      // Ring 1: Neon Cyan #00f2ff
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotationAngle * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.restore();

      // Ring 2: Vibrant Pink #ff2e88
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius * 1.12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 46, 136, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.stroke();
      ctx.restore();

      // 3. Audio Frequency Rays
      if (state === 'speaking' || state === 'listening') {
        const numRays = 40;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);

        for (let i = 0; i < numRays; i++) {
          const angle = (i / numRays) * Math.PI * 2;
          const freqIndex = Math.floor((i / numRays) * 24);
          const freqVal = (dataArray[freqIndex] || 0) / 255;
          const rayLength = dynamicRadius + 8 + freqVal * (baseRadius * 0.9);

          const x1 = Math.cos(angle) * (dynamicRadius - 2);
          const y1 = Math.sin(angle) * (dynamicRadius - 2);
          const x2 = Math.cos(angle) * rayLength;
          const y2 = Math.sin(angle) * rayLength;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);

          // Alternating Vibrant Palette gradient strokes
          if (i % 3 === 0) {
            ctx.strokeStyle = '#ff2e88';
          } else if (i % 3 === 1) {
            ctx.strokeStyle = '#bc13fe';
          } else {
            ctx.strokeStyle = '#00f2ff';
          }

          ctx.lineWidth = 2.5 + freqVal * 2.5;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.45 + freqVal * 0.55;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Black Core Sphere with vibrant inner glow
      const coreGradient = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.2,
        centerY - dynamicRadius * 0.2,
        2,
        centerX,
        centerY,
        dynamicRadius
      );

      if (state === 'disconnected') {
        coreGradient.addColorStop(0, '#1c1c24');
        coreGradient.addColorStop(0.7, '#0d0d12');
        coreGradient.addColorStop(1, '#050507');
      } else if (state === 'connecting') {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#bc13fe');
        coreGradient.addColorStop(0.7, '#ff2e88');
        coreGradient.addColorStop(1, '#000000');
      } else if (state === 'speaking') {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.2, '#ff2e88');
        coreGradient.addColorStop(0.6, '#bc13fe');
        coreGradient.addColorStop(1, '#08080a');
      } else if (state === 'listening') {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.25, '#00f2ff');
        coreGradient.addColorStop(0.7, '#bc13fe');
        coreGradient.addColorStop(1, '#08080a');
      } else {
        // Idle
        coreGradient.addColorStop(0, '#2d1525');
        coreGradient.addColorStop(0.4, '#17081a');
        coreGradient.addColorStop(1, '#08080a');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = '#bc13fe';
      ctx.shadowBlur = state === 'speaking' ? 50 : 30;
      ctx.fill();

      // Border around core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 5. Equalizer bars in the center of the core
      const barCount = 5;
      const barWidth = 7;
      const barGap = 6;
      const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
      const startX = centerX - totalWidth / 2;

      const barColors = ['#ff2e88', '#ff2e88', '#bc13fe', '#00f2ff', '#00f2ff'];
      const defaultHeights = [14, 28, 44, 24, 10];

      for (let b = 0; b < barCount; b++) {
        let barHeight = defaultHeights[b];
        if (state === 'speaking' || state === 'listening') {
          const freqVal = (dataArray[b * 4] || 0) / 255;
          barHeight = Math.max(8, defaultHeights[b] * 0.4 + freqVal * 50);
        } else if (state === 'idle') {
          barHeight = defaultHeights[b] * (0.6 + Math.sin(pulsePhase + b * 0.8) * 0.3);
        } else if (state === 'disconnected') {
          barHeight = 4;
        }

        const bx = startX + b * (barWidth + barGap);
        const by = centerY - barHeight / 2;

        ctx.save();
        ctx.fillStyle = barColors[b];
        ctx.shadowColor = barColors[b];
        ctx.shadowBlur = state !== 'disconnected' ? 14 : 0;
        ctx.beginPath();
        ctx.roundRect(bx, by, barWidth, barHeight, 3.5);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, theme, streamer, recorder]);

  return (
    <div
      id="orb-container"
      className="relative flex flex-col items-center justify-center w-full max-w-sm aspect-square mx-auto cursor-pointer select-none group"
      onClick={onOrbClick}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full filter drop-shadow-[0_0_80px_rgba(188,19,254,0.25)] transition-transform duration-300 group-hover:scale-105"
      />

      {/* Center Action Overlay / Status Badges */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {state === 'disconnected' && (
          <div className="text-center px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,46,136,0.2)] animate-pulse">
            <span className="text-xs font-bold tracking-widest text-[#ff2e88] uppercase">
              Tap Core to Wake Up
            </span>
          </div>
        )}

        {state === 'connecting' && (
          <div className="text-center px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-[#00f2ff]/40 shadow-[0_0_20px_rgba(0,242,255,0.3)]">
            <span className="text-xs font-bold tracking-widest text-[#00f2ff] uppercase animate-pulse">
              Syncing Live Stream...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

