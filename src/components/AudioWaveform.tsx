import React, { useEffect, useRef } from 'react';
import { AssistantState, ThemeConfig } from '../types';
import { AudioRecorder } from '../services/audioRecorder';
import { AudioStreamer } from '../services/audioStreamer';

interface AudioWaveformProps {
  state: AssistantState;
  theme: ThemeConfig;
  streamer: AudioStreamer;
  recorder: AudioRecorder;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  theme,
  streamer,
  recorder,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);

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

      const isActive = state === 'speaking' || state === 'listening';

      if (state === 'speaking') {
        streamer.getFrequencyData(dataArray);
      } else if (state === 'listening') {
        recorder.getFrequencyData(dataArray);
      } else {
        // Idle gentle wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(Date.now() * 0.003 + i * 0.2) * 20 + 25;
        }
      }

      const barCount = 32;
      const barWidth = (width / barCount) * 0.65;
      const gap = (width / barCount) * 0.35;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * 2] || 0;
        const normalized = isActive ? val / 255 : (val / 255) * 0.3;
        const barHeight = Math.max(4, normalized * height * 0.85);

        const x = i * (barWidth + gap) + gap / 2;
        const y = height / 2 - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (state === 'speaking') {
          gradient.addColorStop(0, theme.accentColor);
          gradient.addColorStop(0.5, theme.primaryColor);
          gradient.addColorStop(1, '#ffedd5');
        } else if (state === 'listening') {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(0.5, '#0284c7');
          gradient.addColorStop(1, '#e0f2fe');
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
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
    <div className="w-full max-w-sm h-12 px-4 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
