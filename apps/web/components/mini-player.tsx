"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { BackIcon, CloseIcon, ForwardIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, SparkleIcon } from "@/components/ui/icons";
import { formatClock } from "@/lib/format";
import { useAssistant } from "@/providers/assistant-provider";
import { playbackRates, usePlayer } from "@/providers/player-provider";

export function MiniPlayer() {
  const { current, chapter, isPlaying, isLoading, position, duration, rate, toggle, seek, skip, next, previous, setRate, close } =
    usePlayer();
  const { openAssistant } = useAssistant();

  if (!current || !chapter) return null;

  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;
  const nextRate = playbackRates[(playbackRates.indexOf(rate as (typeof playbackRates)[number]) + 1) % playbackRates.length];

  return (
    <section className="player glass glass--strong" aria-label="Audio player">
      <div className="player__track">
        <Link href={`/books/${current.book.slug}`} className="player__thumb" aria-label={`Open ${current.book.title}`}>
          <Cover title={current.book.title} author={current.book.authorName} slug={current.book.slug} coverUrl={current.book.coverUrl} />
        </Link>
        <div className="player__text">
          <p className="player__title">{chapter.title}</p>
          <p className="player__sub">
            {current.book.title} · {current.book.authorName}
          </p>
        </div>
      </div>

      <div className="player__center">
        <div className="player__controls">
          <Button variant="ghost" icon className="player__edge" onClick={previous} aria-label="Previous chapter">
            <PrevIcon size={16} />
          </Button>
          <Button variant="ghost" icon onClick={() => skip(-15)} aria-label="Back 15 seconds">
            <BackIcon size={20} />
          </Button>
          <Button variant="primary" icon onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} loading={isLoading && !isPlaying}>
            {isLoading && !isPlaying ? null : isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </Button>
          <Button variant="ghost" icon onClick={() => skip(30)} aria-label="Forward 30 seconds">
            <ForwardIcon size={20} />
          </Button>
          <Button variant="ghost" icon className="player__edge" onClick={next} aria-label="Next chapter">
            <NextIcon size={16} />
          </Button>
          <Button variant="glass" icon className="player__ask-inline" onClick={() => openAssistant(current.book)} aria-label="Ask the book assistant">
            <SparkleIcon size={17} />
          </Button>
        </div>
        <div className="player__scrub">
          <span>{formatClock(position)}</span>
          <input
            type="range"
            className="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(position, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            style={{ ["--pct" as string]: `${pct}%` }}
            aria-label="Seek"
            aria-valuetext={`${formatClock(position)} of ${formatClock(duration)}`}
          />
          <span>-{formatClock(Math.max(0, duration - position))}</span>
        </div>
      </div>

      <div className="player__right">
        <Button variant="primary" size="sm" onClick={() => openAssistant(current.book)} aria-label="Ask the book assistant">
          <SparkleIcon size={15} /> Ask
        </Button>
        <Button variant="glass" size="sm" className="rate-btn" onClick={() => setRate(nextRate)} aria-label={`Playback speed ${rate}x, change to ${nextRate}x`}>
          {rate}×
        </Button>
        <Button variant="ghost" icon size="sm" onClick={close} aria-label="Close player">
          <CloseIcon size={16} />
        </Button>
      </div>
    </section>
  );
}
