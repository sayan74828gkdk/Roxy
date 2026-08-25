/**
 * AudioRecorder captures microphone input at 16kHz sample rate,
 * converts Float32 to 16-bit little-endian PCM, and streams base64 chunks
 * to the LiveSession WebSocket. Also provides an AnalyserNode for mic visualization.
 */

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording: boolean = false;
  private isMuted: boolean = false;
  private onAudioChunkCallback?: (base64Chunk: string) => void;
  private onUserSpeakingCallback?: (isSpeaking: boolean, volume: number) => void;

  public async start(onAudioChunk: (base64Chunk: string) => void): Promise<void> {
    if (this.isRecording) return;
    this.onAudioChunkCallback = onAudioChunk;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;

      // 4096 buffer size gives ~256ms chunk at 16kHz
      this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
        // Prevent audio feedback by clearing output channel
        const outputData = e.outputBuffer.getChannelData(0);
        outputData.fill(0);

        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS for speech activity detection
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        const isSpeaking = rms > 0.015;
        this.onUserSpeakingCallback?.(isSpeaking, Math.min(1, rms * 8));

        // Convert Float32 to 16-bit PCM little-endian
        const pcmBuffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(pcmBuffer);

        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          // scale to 16-bit signed integer
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        // Convert to base64
        const bytes = new Uint8Array(pcmBuffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        this.onAudioChunkCallback?.(base64Audio);
      };

      this.source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

      this.isRecording = true;
    } catch (err) {
      console.error('[AudioRecorder] Failed to start microphone:', err);
      this.stop();
      throw err;
    }
  }

  public setOnUserSpeaking(cb: (isSpeaking: boolean, volume: number) => void) {
    this.onUserSpeakingCallback = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    }
  }

  public getWaveformData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public isMicrophoneMuted(): boolean {
    return this.isMuted;
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
