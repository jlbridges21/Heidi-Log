"use client";

import { useEffect, useState } from "react";
import type { BabyEvent } from "@/types/babyEvent";
import { formatElapsed, getFeedSideLabel } from "@/lib/dateUtils";
import { endFeed } from "@/lib/babyEvents";

interface ActiveFeedCardProps {
  activeFeed: BabyEvent;
  onEnded: () => void;
  onError: (message: string) => void;
}

export default function ActiveFeedCard({
  activeFeed,
  onEnded,
  onError,
}: ActiveFeedCardProps) {
  const [elapsed, setElapsed] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeFeed.feed_start_time) {
      return;
    }

    const update = () => {
      setElapsed(formatElapsed(activeFeed.feed_start_time!));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeFeed.feed_start_time]);

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

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 shadow-sm">
      <div className="mb-1 text-sm font-medium uppercase tracking-wide text-rose-600">
        Feeding in progress
      </div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-rose-900">
            {getFeedSideLabel(activeFeed.feed_side)} side
          </p>
          <p className="text-sm text-rose-700">Tap End when baby is done</p>
        </div>
        <div className="font-mono text-3xl font-bold tabular-nums text-rose-900">
          {elapsed}
        </div>
      </div>
      <button
        type="button"
        onClick={handleEndFeeding}
        disabled={loading}
        className="w-full rounded-xl bg-rose-500 px-4 py-4 text-base font-semibold text-white transition-colors active:bg-rose-600 disabled:opacity-50"
      >
        {loading ? "Saving…" : "End Feeding"}
      </button>
    </div>
  );
}
