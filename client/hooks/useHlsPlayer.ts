'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface UseHlsPlayerOptions {
  src: string;
  initialSeconds?: number;
  onProgress: (seconds: number) => void;
  onCompleted: () => void;
}

interface UseHlsPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  qualities: { index: number; label: string }[];
  error: boolean;
  togglePlay: () => void;
  skip: (delta: number) => void;
  seek: (time: number) => void;
  retry: () => void;
}

/**
 * Manages HLS.js lifecycle, video event listeners, and playback state for the
 * course player. Separated from the rendering layer so CoursePlayer stays under
 * 200 lines and the HLS setup/teardown logic can be reasoned about in isolation.
 */
export function useHlsPlayer({
  src,
  initialSeconds = 0,
  onProgress,
  onCompleted,
}: UseHlsPlayerOptions): UseHlsPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastReport = useRef(0);
  const completed = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [qualities, setQualities] = useState<{ index: number; label: string }[]>([]);
  const [error, setError] = useState(false);

  // Keep stable refs to the callbacks so the time-update listener doesn't need
  // to re-register on every render.
  const onProgressRef = useRef(onProgress);
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onCompletedRef.current = onCompleted; }, [onCompleted]);

  // ── HLS.js initialisation ─────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    completed.current = false;
    lastReport.current = 0;
    setError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualities(hls.levels.map((level, index) => ({ index, label: `${level.height}p` })));
        if (initialSeconds > 0) video.currentTime = initialSeconds;
      });
      // Recover from transient stalls; surface error state only on fatal failures.
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setError(true);
          hls.destroy();
        }
      });
      return () => { hls.destroy(); hlsRef.current = null; };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const onMeta = (): void => { if (initialSeconds > 0) video.currentTime = initialSeconds; };
      video.addEventListener('loadedmetadata', onMeta);
      return () => video.removeEventListener('loadedmetadata', onMeta);
    }
    return undefined;
  }, [src, initialSeconds]);

  // ── Video event listeners ─────────────────────────────────────────────────
  // Attached imperatively so they don't get torn down/re-added on each render.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onPlay = (): void => setPlaying(true);
    const onPause = (): void => setPlaying(false);
    const onDurationChange = (): void => setDuration(video.duration);
    const onVideoError = (): void => setError(true);
    const onTimeUpdate = (): void => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
      // Report progress at most once every 10 s to avoid excessive API calls.
      if (video.currentTime - lastReport.current >= 10) {
        lastReport.current = video.currentTime;
        onProgressRef.current(Math.floor(video.currentTime));
      }
      if (!completed.current && video.duration > 0 && video.currentTime / video.duration >= 0.9) {
        completed.current = true;
        onCompletedRef.current();
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onVideoError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onVideoError);
    };
  }, []); // run once — the ref is stable, callbacks use refs for freshness

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = time;
  }, []);

  const retry = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);
    if (Hls.isSupported()) {
      hlsRef.current?.destroy();
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.load();
    }
  }, [src]);

  return { videoRef, playing, currentTime, duration, buffered, qualities, error, togglePlay, skip, seek, retry };
}
