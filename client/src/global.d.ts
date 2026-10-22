interface HlsErrorData {
  fatal: boolean;
}

declare class Hls {
  static readonly Events: {
    readonly MANIFEST_PARSED: string;
    readonly ERROR: string;
  };
  static isSupported(): boolean;

  constructor();
  destroy(): void;
  loadSource(url: string): void;
  attachMedia(media: HTMLVideoElement): void;
  on(event: string, callback: (event: string, data: HlsErrorData) => void): void;
}

interface Window {
  Hls?: typeof Hls;
}
