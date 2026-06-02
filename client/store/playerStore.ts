import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

interface PlayerState {
  volume: number; // 0–1
  muted: boolean;
  playbackRate: PlaybackRate;
  /** Selected HLS quality level index, or -1 for auto. */
  quality: number;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  setQuality: (level: number) => void;
}

/** Video player preferences — persisted so they survive lesson navigation. */
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      volume: 1,
      muted: false,
      playbackRate: 1,
      quality: -1,
      setVolume: (volume) => set({ volume }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setQuality: (quality) => set({ quality }),
    }),
    { name: 'nextlearn-player' },
  ),
);
