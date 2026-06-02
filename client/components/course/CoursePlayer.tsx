'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { PlayerControls } from './PlayerControls';

interface CoursePlayerProps {
  src: string;
  /** Resume position in seconds. */
  initialSeconds?: number;
  /** Called ~every 10s of playback with the current second. */
  onProgress: (seconds: number) => void;
  /** Called once when playback passes 90%. */
  onCompleted: () => void;
}

/**
 * Custom HLS.js video player with adaptive streaming, custom controls, and
 * keyboard shortcuts. HLS.js lifecycle management lives in `useHlsPlayer`;
 * this component owns rendering and persisted-preference sync only.
 */
export function CoursePlayer({
  src,
  initialSeconds = 0,
  onProgress,
  onCompleted,
}: CoursePlayerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { volume, muted, playbackRate, quality, setVolume, toggleMute, setPlaybackRate, setQuality } =
    usePlayerStore();

  const { videoRef, playing, currentTime, duration, buffered, qualities, error, togglePlay, skip, seek, retry } =
    useHlsPlayer({ src, initialSeconds, onProgress, onCompleted });

  // ── Sync persisted player preferences to the <video> element ─────────────
  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.volume = volume; v.muted = muted; }
  }, [videoRef, volume, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = playbackRate;
  }, [videoRef, playbackRate]);

  // ── Fullscreen detection ──────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  useEffect(() => {
    const onFs = (): void => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const changeVolume = useCallback(
    (value: number) => { setVolume(value); if (value > 0 && muted) toggleMute(); },
    [setVolume, muted, toggleMute],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skip(-10); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
        case 'f': toggleFullscreen(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, skip, changeVolume, volume, toggleFullscreen]);

  return (
    <div ref={containerRef} className="relative aspect-video w-full overflow-hidden bg-black">
      <video ref={videoRef} className="size-full" onClick={togglePlay} playsInline />
      {error && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center text-white"
        >
          <p className="max-w-sm text-sm">
            This video couldn&apos;t be loaded. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
          >
            Retry
          </button>
        </div>
      )}
      <PlayerControls
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        qualities={qualities}
        currentQuality={quality}
        isFullscreen={isFullscreen}
        onPlayPause={togglePlay}
        onSkip={skip}
        onSeek={seek}
        onVolume={changeVolume}
        onToggleMute={toggleMute}
        onRate={setPlaybackRate}
        onQuality={setQuality}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
