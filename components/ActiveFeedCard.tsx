"use client";

import { useEffect, useState } from "react";
import type { BabyEvent } from "@/types/babyEvent";
import BottleOuncesInput from "@/components/BottleOuncesInput";
import {
  formatFeedElapsed,
  getActiveFeedMethodLabel,
  parseBottleOunces,
  validateBottleOunces,
} from "@/lib/dateUtils";
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
  const [showOuncesPrompt, setShowOuncesPrompt] = useState(false);
  const [ouncesInput, setOuncesInput] = useState("");
  const [ouncesError, setOuncesError] = useState<string | null>(null);

  const isPaused = !!activeFeed.feed_paused_at;
  const isBottleFeed = activeFeed.feed_side === "bottle";

  useEffect(() => {
    if (!activeFeed.feed_start_time || isBottleFeed) {
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
    isBottleFeed,
  ]);

  const handleEndFeeding = async () => {
    if (isBottleFeed) {
      setShowOuncesPrompt(true);
      return;
    }

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

  const handleSaveBottleFeed = async () => {
    const error = validateBottleOunces(ouncesInput);
    if (error) {
      setOuncesError(error);
      return;
    }

    setOuncesError(null);
    setLoading(true);

    try {
      await endFeed(activeFeed.id, new Date().toISOString(), {
        bottle_ounces: parseBottleOunces(ouncesInput),
      });
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

  if (showOuncesPrompt) {
    return (
      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 shadow-sm">
        <div className="mb-1 text-sm font-medium uppercase tracking-wide text-sky-600">
          Finish bottle feed
        </div>
        <p className="mb-4 text-lg font-semibold text-sky-900">
          {getActiveFeedMethodLabel(
            activeFeed.feed_side,
            activeFeed.bottle_type
          )}
        </p>
        <BottleOuncesInput
          id="active-bottle-ounces"
          value={ouncesInput}
          onChange={(value) => {
            setOuncesInput(value);
            setOuncesError(null);
          }}
          error={ouncesError}
          autoFocus
        />
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSaveBottleFeed}
            disabled={loading}
            className="w-full rounded-xl bg-sky-500 px-4 py-4 text-base font-semibold text-white active:bg-sky-600 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Feeding"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowOuncesPrompt(false);
              setOuncesError(null);
            }}
            disabled={loading}
            className="w-full rounded-xl border-2 border-sky-200 px-4 py-3 text-base font-semibold text-sky-800 active:bg-sky-100 disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 p-5 shadow-sm ${
        isBottleFeed
          ? "border-sky-200 bg-sky-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div
        className={`mb-1 text-sm font-medium uppercase tracking-wide ${
          isBottleFeed ? "text-sky-600" : "text-rose-600"
        }`}
      >
        {isPaused ? "Feeding paused" : "Feeding in progress"}
      </div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p
            className={`text-lg font-semibold ${
              isBottleFeed ? "text-sky-900" : "text-rose-900"
            }`}
          >
            {getActiveFeedMethodLabel(
              activeFeed.feed_side,
              activeFeed.bottle_type
            )}
          </p>
          <p
            className={`text-sm ${
              isBottleFeed ? "text-sky-700" : "text-rose-700"
            }`}
          >
            {isBottleFeed
              ? "Enter ounces when baby is done"
              : isPaused
                ? "Tap Resume when ready to continue"
                : "Tap Pause for a burp break"}
          </p>
        </div>
        {!isBottleFeed && (
          <div
            className={`font-mono text-3xl font-bold tabular-nums text-rose-900 ${isPaused ? "opacity-60" : ""}`}
          >
            {elapsed}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {!isBottleFeed &&
          (isPaused ? (
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
          ))}
        <button
          type="button"
          onClick={handleEndFeeding}
          disabled={loading || pauseLoading}
          className={`w-full rounded-xl px-4 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50 ${
            isBottleFeed
              ? "bg-sky-500 active:bg-sky-600"
              : "bg-slate-800 active:bg-slate-900"
          }`}
        >
          {loading
            ? "Saving…"
            : isBottleFeed
              ? "End & Enter Ounces"
              : "End Feeding"}
        </button>
      </div>
    </div>
  );
}
