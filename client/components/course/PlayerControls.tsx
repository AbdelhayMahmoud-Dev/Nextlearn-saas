'use client';

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { PlaybackRate } from '@/store/playerStore';

const RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface PlayerControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  playbackRate: PlaybackRate;
  qualities: { index: number; label: string }[];
  currentQuality: number;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSkip: (delta: number) => void;
  onSeek: (time: number) => void;
  onVolume: (value: number) => void;
  onToggleMute: () => void;
  onRate: (rate: PlaybackRate) => void;
  onQuality: (index: number) => void;
  onToggleFullscreen: () => void;
}

/** Custom video controls bar (no native browser controls). */
export function PlayerControls(props: PlayerControlsProps): JSX.Element {
  const { currentTime, duration, buffered } = props;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-white">
      <div className="relative flex h-4 items-center">
        <div className="absolute h-1 w-full rounded-full bg-white/30" />
        <div className="absolute h-1 rounded-full bg-white/40" style={{ width: `${bufPct}%` }} />
        <div className="absolute h-1 rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={currentTime}
          onChange={(e) => props.onSeek(Number(e.target.value))}
          aria-label="Seek"
          className="absolute h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary"
        />
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={props.onPlayPause} aria-label={props.playing ? 'Pause' : 'Play'} className="hover:text-brand-primary">
          {props.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button type="button" onClick={() => props.onSkip(-10)} aria-label="Rewind 10 seconds" className="hover:text-brand-primary">
          <RotateCcw className="size-5" />
        </button>
        <button type="button" onClick={() => props.onSkip(10)} aria-label="Forward 10 seconds" className="hover:text-brand-primary">
          <RotateCw className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={props.onToggleMute} aria-label={props.muted ? 'Unmute' : 'Mute'} className="hover:text-brand-primary">
            {props.muted || props.volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={props.muted ? 0 : props.volume}
            onChange={(e) => props.onVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer accent-brand-primary"
          />
        </div>

        <span className="tabular-nums text-xs text-white/80">
          {fmt(currentTime)} / {fmt(duration)}
        </span>

        <div className="ml-auto flex items-center gap-3">
          <label className="sr-only" htmlFor="speed">
            Playback speed
          </label>
          <select
            id="speed"
            value={props.playbackRate}
            onChange={(e) => props.onRate(Number(e.target.value) as PlaybackRate)}
            className="rounded bg-white/10 px-1.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {RATES.map((r) => (
              <option key={r} value={r} className="text-black">
                {r}x
              </option>
            ))}
          </select>

          {props.qualities.length > 0 && (
            <>
              <label className="sr-only" htmlFor="quality">
                Quality
              </label>
              <select
                id="quality"
                value={props.currentQuality}
                onChange={(e) => props.onQuality(Number(e.target.value))}
                className="rounded bg-white/10 px-1.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <option value={-1} className="text-black">
                  Auto
                </option>
                {props.qualities.map((q) => (
                  <option key={q.index} value={q.index} className="text-black">
                    {q.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <button type="button" onClick={props.onToggleFullscreen} aria-label="Toggle fullscreen" className="hover:text-brand-primary">
            {props.isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
