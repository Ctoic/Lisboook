"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { ChapterContract } from "@lisbook/types";
import { readJson, storageKeys, writeJson } from "@/lib/storage";
import { useLibrary, type BookSnapshot } from "./library-provider";
import { useToast } from "./toast-provider";

export const playbackRates = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

interface NowPlaying {
  book: BookSnapshot;
  chapters: ChapterContract[];
  index: number;
}

interface PlayerContextValue {
  current: NowPlaying | null;
  chapter: ChapterContract | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  rate: number;
  play: (book: BookSnapshot, chapters: ChapterContract[], index?: number) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  next: () => void;
  previous: () => void;
  setRate: (rate: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function hasAudio(chapter: ChapterContract) {
  return Boolean(chapter.audioUrl);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const { progress, saveProgress } = useLibrary();
  const toast = useToast();
  const lastSaved = useRef(0);

  const chapter = current ? current.chapters[current.index] ?? null : null;

  useEffect(() => {
    setRateState(readJson<number>(storageKeys.playbackRate, 1));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-player", Boolean(current));
  }, [current]);

  const persist = useCallback(
    (force = false) => {
      const audio = audioRef.current;
      if (!audio || !current || !chapter) return;
      const now = Date.now();
      if (!force && now - lastSaved.current < 4000) return;
      lastSaved.current = now;
      saveProgress({
        book: current.book,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapterNumber,
        position: audio.currentTime,
        duration: audio.duration || chapter.durationSeconds
      });
    },
    [chapter, current, saveProgress]
  );

  // Load the source whenever the chapter changes, resuming saved position.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !chapter?.audioUrl) return;
    const saved = progress[chapter.id];
    setIsLoading(true);
    setPosition(0);
    setDuration(chapter.durationSeconds);
    audio.src = chapter.audioUrl;
    const resumeAt = saved && saved.duration - saved.position > 10 ? saved.position : 0;
    const onReady = () => {
      // load() resets playbackRate to defaultPlaybackRate, so apply the preference once metadata is in.
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
      if (resumeAt) audio.currentTime = resumeAt;
      audio.play().catch(() => setIsPlaying(false));
    };
    audio.addEventListener("loadedmetadata", onReady, { once: true });
    audio.load();
    return () => audio.removeEventListener("loadedmetadata", onReady);
    // Deliberately keyed on the chapter id only: reloading on every progress save would restart playback.
  }, [chapter?.id]);

  const play = useCallback(
    (book: BookSnapshot, chapters: ChapterContract[], index = 0) => {
      const target = chapters[index];
      if (!target) return;
      if (!hasAudio(target)) {
        toast({
          tone: "info",
          title: "Audio coming soon",
          description: `“${target.title}” hasn't been uploaded yet. Check back shortly.`
        });
        return;
      }
      if (current?.book.id === book.id && current.index === index) {
        audioRef.current?.play().catch(() => undefined);
        return;
      }
      persist(true);
      setCurrent({ book, chapters, index });
    },
    [current, persist, toast]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !chapter) return;
    if (audio.paused) audio.play().catch(() => undefined);
    else audio.pause();
  }, [chapter]);

  const pause = useCallback(() => audioRef.current?.pause(), []);
  const resume = useCallback(() => {
    if (chapter) audioRef.current?.play().catch(() => undefined);
  }, [chapter]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    setPosition(audio.currentTime);
  }, []);

  const skip = useCallback((delta: number) => seek((audioRef.current?.currentTime ?? 0) + delta), [seek]);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (!current) return;
      let index = current.index + direction;
      while (current.chapters[index] && !hasAudio(current.chapters[index])) index += direction;
      if (!current.chapters[index]) return false;
      persist(true);
      setCurrent({ ...current, index });
      return true;
    },
    [current, persist]
  );

  const next = useCallback(() => void goTo(1), [goTo]);

  const previous = useCallback(() => {
    if ((audioRef.current?.currentTime ?? 0) > 5) seek(0);
    else if (!goTo(-1)) seek(0);
  }, [goTo, seek]);

  const setRate = useCallback((value: number) => {
    setRateState(value);
    writeJson(storageKeys.playbackRate, value);
    if (audioRef.current) {
      audioRef.current.defaultPlaybackRate = value;
      audioRef.current.playbackRate = value;
    }
  }, []);

  const close = useCallback(() => {
    persist(true);
    audioRef.current?.pause();
    setCurrent(null);
    setIsPlaying(false);
  }, [persist]);

  // Media Session integration: lock-screen / hardware media keys.
  useEffect(() => {
    if (!current || !chapter || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapter.title,
      artist: current.book.authorName,
      album: current.book.title,
      artwork: current.book.coverUrl ? [{ src: current.book.coverUrl }] : []
    });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(30));
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", previous);
  }, [chapter, current, next, previous, skip, toggle]);

  const value = useMemo(
    () => ({
      current,
      chapter,
      isPlaying,
      isLoading,
      position,
      duration,
      rate,
      play,
      toggle,
      pause,
      resume,
      seek,
      skip,
      next,
      previous,
      setRate,
      close
    }),
    [current, chapter, isPlaying, isLoading, position, duration, rate, play, toggle, pause, resume, seek, skip, next, previous, setRate, close]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          persist(true);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onTimeUpdate={(event) => {
          setPosition(event.currentTarget.currentTime);
          persist();
        }}
        onDurationChange={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration);
        }}
        onEnded={() => {
          persist(true);
          if (!goTo(1)) setIsPlaying(false);
        }}
        onError={() => {
          if (!current) return;
          setIsLoading(false);
          setIsPlaying(false);
          toast({ tone: "error", title: "Playback failed", description: "This chapter couldn't be loaded. Please try again later." });
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}
