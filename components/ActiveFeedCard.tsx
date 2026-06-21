"use client";

import { useEffect, useState } from "react";
import type { BabyEvent } from "@/types/babyEvent";
import { formatFeedElapsed, getFeedSideLabel } from "@/lib/dateUtils";
import { endFeed, pauseFeed, resumeFeed } from "@/lib/babyEvents";

interface ActiveFeedCardProps {
  activeFeed: BabyEvent;
  onEnded: () => void;
  onUpdated: (feed: BabyEvent) => void;
  onError: (message: string) => void;
}

export default function ActiveFeedCard({
  activeFeed,
  onEnded,
  onUpdated,
  onError,
}: ActiveFeedCardProps) {
  const [elapsed, setElapsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const isPaused = !!activeFeed.feed_paused_at;

  useEffect(() => {
    if (!activeFeed.feed_start_time) {
      return;
    }

    const update = () => {
      setElapsed(
        formatFeedElapsed(
          activeFeed.feed_start_time!,
          activeFeed.feed_paused_at,
          activeFeed.feed_paused_seconds ?? 0
        )
      );
    };

    update();

    if (isPaused) {
      return;
    }

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [
    activeFeed.feed_start_time,
    activeFeed.feed_paused_at,
    activeFeed.feed_paused_seconds,
    isPaused,
  ]);

  const handleEndFeeding = async () => {
    setLoading(true);
    try {
      await endFeed(activeFeed.id, new Date().toISOString());
      onEnded();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to end feeding");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setPauseLoading(true);
    try {
      const updated = await pauseFeed(activeFeed.id);
      onUpdated(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to pause feeding");
    } finally {
      setPauseLoading(false);
    }
  };

  const handleResume = async () => {
    setPauseLoading(true);
    try {
      const updated = await resumeFeed(activeFeed.id);
      onUpdated(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to resume feeding");
    } finally {
      setPauseLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 shadow-sm">
      <div className="mb-1 text-sm font-medium uppercase tracking-wide text-rose-600">
        {isPaused ? "Feeding paused" : "Feeding in progress"}
      </div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-rose-900">
            {getFeedSideLabel(activeFeed.feed_side)} side
          </p>
          <p className="text-sm text-rose-700">
            {isPaused
              ? "Tap Resume when ready to continue"
              : "Tap Pause for a burp break"}
          </p>
        </div>
        <div
          className={`font-mono text-3xl font-bold tabular-nums text-rose-900 ${isPaused ? "opacity-60" : ""}`}
        >
          {elapsed}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {isPaused ? (
          <button
            type="button"
            onClick={handleResume}
            disabled={pauseLoading || loading}
            className="w-full rounded-xl bg-rose-500 px-4 py-4 text-base font-semibold text-white transition-colors active:bg-rose-600 disabled:opacity-50"
          >
            {pauseLoading ? "Resuming…" : "Resume Feeding"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            disabled={pauseLoading || loading}
            className="w-full rounded-xl border-2 border-rose-300 bg-white px-4 py-4 text-base font-semibold text-rose-800 transition-colors active:bg-rose-100 disabled:opacity-50"
          >
            {pauseLoading ? "Pausing…" : "Pause"}
          </button>
        )}
        <button
          type="button"
          onClick={handleEndFeeding}
          disabled={loading || pauseLoading}
          className="w-full rounded-xl bg-slate-800 px-4 py-4 text-base font-semibold text-white transition-colors active:bg-slate-900 disabled:opacity-50"
        >
          {loading ? "Saving…" : "End Feeding"}
        </button>
      </div>
    </div>
  );
}
