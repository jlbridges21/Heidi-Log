"use client";

import { useState } from "react";
import type { FeedSide } from "@/types/babyEvent";
import { createCompletedFeed, startFeed } from "@/lib/babyEvents";
import {
  nowISO,
  toISOFromLocalInput,
  toLocalInputValue,
  validateFeedTimes,
} from "@/lib/dateUtils";

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
  hasActiveFeed: boolean;
}

type Step = "side" | "timing" | "manual";

export default function FeedModal({
  isOpen,
  onClose,
  onSaved,
  onError,
  hasActiveFeed,
}: FeedModalProps) {
  const [step, setStep] = useState<Step>("side");
  const [side, setSide] = useState<FeedSide | null>(null);
  const [startLocal, setStartLocal] = useState(toLocalInputValue(nowISO()));
  const [endLocal, setEndLocal] = useState(toLocalInputValue(nowISO()));
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const reset = () => {
    setStep("side");
    setSide(null);
    setStartLocal(toLocalInputValue(nowISO()));
    setEndLocal(toLocalInputValue(nowISO()));
    setValidationError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectSide = (selected: FeedSide) => {
    setSide(selected);
    setStep("timing");
  };

  const handleStartNow = async () => {
    if (!side) return;

    if (hasActiveFeed) {
      onError("A feeding session is already in progress");
      return;
    }

    setLoading(true);
    try {
      await startFeed({
        feed_side: side,
        feed_start_time: nowISO(),
      });
      reset();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start feeding");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!side) return;

    const error = validateFeedTimes(startLocal, endLocal);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setLoading(true);

    try {
      await createCompletedFeed({
        feed_side: side,
        feed_start_time: toISOFromLocalInput(startLocal),
        feed_end_time: toISOFromLocalInput(endLocal),
      });
      reset();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save feeding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Feed</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 active:bg-slate-100"
          >
            Close
          </button>
        </div>

        {step === "side" && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleSelectSide("left")}
              className="rounded-xl bg-rose-100 px-4 py-4 text-base font-semibold text-rose-900 active:bg-rose-200"
            >
              Left Boob
            </button>
            <button
              type="button"
              onClick={() => handleSelectSide("right")}
              className="rounded-xl bg-rose-100 px-4 py-4 text-base font-semibold text-rose-900 active:bg-rose-200"
            >
              Right Boob
            </button>
          </div>
        )}

        {step === "timing" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              {side === "left" ? "Left" : "Right"} side selected
            </p>
            <button
              type="button"
              onClick={handleStartNow}
              disabled={loading || hasActiveFeed}
              className="rounded-xl bg-slate-800 px-4 py-4 text-base font-semibold text-white active:bg-slate-900 disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start Now"}
            </button>
            <button
              type="button"
              onClick={() => setStep("manual")}
              disabled={loading}
              className="rounded-xl border-2 border-slate-200 px-4 py-4 text-base font-semibold text-slate-800 active:bg-slate-50 disabled:opacity-50"
            >
              Enter Manually
            </button>
            <button
              type="button"
              onClick={() => setStep("side")}
              className="text-sm font-medium text-slate-500"
            >
              ← Change side
            </button>
          </div>
        )}

        {step === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              {side === "left" ? "Left" : "Right"} side
            </p>
            <div>
              <label
                htmlFor="feed-start"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Start time
              </label>
              <input
                id="feed-start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => {
                  setStartLocal(e.target.value);
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="feed-end"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                End time
              </label>
              <input
                id="feed-end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => {
                  setEndLocal(e.target.value);
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
            </div>
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("timing")}
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
