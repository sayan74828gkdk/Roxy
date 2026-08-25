import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, SwitchCamera, Eye, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';
import { VideoRecorder } from '../services/videoRecorder';
import { ThemeConfig } from '../types';

interface CameraViewProps {
  isOpen: boolean;
  onClose: () => void;
  onFrameCaptured: (base64Image: string) => void;
  theme: ThemeConfig;
  isConnected: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isOpen,
  onClose,
  onFrameCaptured,
  theme,
  isConnected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<VideoRecorder>(new VideoRecorder());
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const recorder = recorderRef.current;

    async function initCamera() {
      if (isOpen && videoRef.current) {
        setHasCameraError(null);
        try {
          await recorder.start(videoRef.current, (base64) => {
            if (isMounted) {
              onFrameCaptured(base64);
            }
          }, facingMode);
          if (isMounted) {
            setIsCapturing(true);
          }
        } catch (err: unknown) {
          if (isMounted) {
            const errorMsg = err instanceof Error ? err.message : 'Camera access denied or unavailable';
            setHasCameraError(errorMsg);
            setIsCapturing(false);
          }
        }
      } else {
        recorder.stop();
        if (isMounted) {
          setIsCapturing(false);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      recorder.stop();
    };
  }, [isOpen, facingMode]);

  const handleSwitchCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newMode = await recorderRef.current.switchCamera();
      setFacingMode(newMode);
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const handleManualSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    // captureSingleFrame automatically invokes the onFrameCaptured callback once
    recorderRef.current.captureSingleFrame();
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-viewport-card"
      className={`fixed z-40 transition-all duration-300 ${
        isMinimized
          ? 'bottom-24 right-6 w-36 sm:w-44 aspect-video'
          : 'top-20 right-4 sm:top-24 sm:right-8 w-64 sm:w-80 aspect-4/3'
      } rounded-3xl overflow-hidden bg-black/90 border border-white/20 shadow-[0_0_40px_rgba(255,46,136,0.3)] backdrop-blur-xl group flex flex-col`}
      style={{
        borderColor: `${theme.primaryColor}88`,
        boxShadow: `0 0 35px ${theme.glowColor}`,
      }}
    >
      {/* Flash animation on capture / snapshot */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping opacity-60" />
      )}

      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              isCapturing ? 'bg-[#00f2ff] animate-ping' : 'bg-rose-500'
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 flex items-center gap-1">
            <Eye className="w-3 h-3 text-[#00f2ff]" />
            Roxy Vision
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Flip Cam */}
          <button
            onClick={handleSwitchCamera}
            title="Switch Camera (Front/Back)"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Expand */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Camera' : 'Minimize'}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Turn Off Camera"
            className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
        {hasCameraError ? (
          <div className="p-4 text-center">
            <CameraOff className="w-8 h-8 mx-auto text-rose-400 mb-2 opacity-80" />
            <p className="text-xs text-rose-300 font-semibold mb-1">Camera Inaccessible</p>
            <p className="text-[10px] text-white/40 leading-tight">{hasCameraError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />
        )}

        {/* Scanlines Effect & Holographic Reticle */}
        {isCapturing && !hasCameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Hologram Corner Brackets */}
            <div className="w-4/5 h-4/5 border border-dashed border-[#00f2ff]/30 rounded-2xl relative">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#ff2e88]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#ff2e88]" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#ff2e88]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#ff2e88]" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      {!isMinimized && (
        <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-30">
          <span className="text-[10px] text-white/60 font-medium">
            {isConnected ? 'Roxy is watching in real-time' : 'Connect to chat with Roxy'}
          </span>

          <button
            onClick={handleManualSnapshot}
            title="Snap & Inspect Frame"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#ff2e88] to-[#bc13fe] hover:opacity-90 text-white text-[10px] font-bold shadow-[0_0_12px_rgba(255,46,136,0.5)] transition-transform active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            Look Now
          </button>
        </div>
      )}
    </div>
  );
};
