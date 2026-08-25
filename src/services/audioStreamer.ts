/**
 * AudioStreamer handles decoding and smooth gapless playback of 24kHz 16-bit PCM audio chunks
 * received from Gemini Live API, with real-time AnalyserNode output and instant interruption support.
 */

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private onStateChangeCallback?: (isPlaying: boolean) => void;
  private sampleRate: number = 24000;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  public init(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.nextStartTime = this.audioCtx.currentTime;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  public setOnStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getVolume(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }

  public getWaveformData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    }
  }

  /**
   * Enqueue a base64 encoded PCM16 24kHz audio chunk for gapless playback
   */
  public addPCM16Chunk(base64Data: string): void {
    const ctx = this.init();
    if (!base64Data) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM little-endian to Float32
      const numSamples = Math.floor(bytes.length / 2);
      const float32Array = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true); // little-endian
        float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, this.sampleRate);
      audioBuffer.copyToChannel(float32Array, 0);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.gainNode!);

      const currentTime = ctx.currentTime;
      // If nextStartTime is in the past, reset to currentTime + tiny buffer
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02;
      }

      const startTime = this.nextStartTime;
      sourceNode.start(startTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(sourceNode);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onStateChangeCallback?.(true);
      }

      sourceNode.onended = () => {
        const index = this.activeSources.indexOf(sourceNode);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        if (this.activeSources.length === 0 && ctx.currentTime >= this.nextStartTime - 0.05) {
          this.isPlaying = false;
          this.onStateChangeCallback?.(false);
        }
      };
    } catch (err) {
      console.error('[AudioStreamer] Error decoding audio chunk:', err);
    }
  }

  /**
   * Immediately stops all active audio playback and resets the queue when an interruption occurs
   */
  public stopAndClearQueue(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might already have finished
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onStateChangeCallback?.(false);
    }
  }

  public setVolume(vol: number): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.audioCtx.currentTime);
    }
  }

  public close(): void {
    this.stopAndClearQueue();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
