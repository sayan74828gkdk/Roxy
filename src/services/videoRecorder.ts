export class VideoRecorder {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private captureIntervalId: number | null = null;
  private isCapturing: boolean = false;
  private facingMode: 'user' | 'environment' = 'user';
  private onFrameCallback: ((base64Image: string) => void) | null = null;

  constructor() {
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = 512;
    this.canvasElement.height = 384;
  }

  public async start(
    videoEl: HTMLVideoElement,
    onFrame: (base64Image: string) => void,
    facing: 'user' | 'environment' = 'user'
  ): Promise<MediaStream> {
    this.videoElement = videoEl;
    this.onFrameCallback = onFrame;
    this.facingMode = facing;

    this.stopStream();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play();
      }

      this.isCapturing = true;
      this.startFrameLoop();
      return this.stream;
    } catch (err) {
      console.error('[VideoRecorder] Failed to start camera:', err);
      this.stop();
      throw err;
    }
  }

  public async switchCamera(): Promise<'user' | 'environment'> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.isCapturing && this.videoElement && this.onFrameCallback) {
      await this.start(this.videoElement, this.onFrameCallback, this.facingMode);
    }
    return this.facingMode;
  }

  public getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  public isActive(): boolean {
    return this.isCapturing && this.stream !== null;
  }

  private startFrameLoop(): void {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
    }

    // Capture a frame every 800ms (1.25 FPS) - optimal for Gemini Live vision without choking bandwidth
    this.captureIntervalId = window.setInterval(() => {
      this.captureSingleFrame();
    }, 800);

    // Also trigger initial frame immediately after small warm-up delay
    setTimeout(() => {
      this.captureSingleFrame();
    }, 300);
  }

  public captureSingleFrame(): string | null {
    if (!this.videoElement || !this.canvasElement || !this.isCapturing) {
      return null;
    }

    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Maintain aspect ratio scaling
    const targetWidth = 512;
    const targetHeight = Math.round((video.videoHeight / video.videoWidth) * targetWidth) || 384;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      const base64Data = dataUrl.split(',')[1];
      if (base64Data && this.onFrameCallback) {
        this.onFrameCallback(base64Data);
      }
      return base64Data;
    } catch (err) {
      console.warn('[VideoRecorder] Failed to capture frame:', err);
      return null;
    }
  }

  private stopStream(): void {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
      this.captureIntervalId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  public stop(): void {
    this.isCapturing = false;
    this.stopStream();
    this.videoElement = null;
    this.onFrameCallback = null;
  }
}
