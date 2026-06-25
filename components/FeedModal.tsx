"use client";

import { useState } from "react";
import type { BottleType, FeedSide } from "@/types/babyEvent";
import { BOTTLE_TYPES, FEED_SIDES } from "@/types/babyEvent";
import { createCompletedFeed, startFeed } from "@/lib/babyEvents";
import BottleOuncesInput from "@/components/BottleOuncesInput";
import {
  getBottleTypeButtonLabel,
  getFeedMethodSelectedLabel,
  getFeedSideButtonLabel,
  nowISO,
  parseBottleOunces,
  toISOFromLocalInput,
  toLocalInputValue,
  validateBottleOunces,
  validateFeedTimes,
} from "@/lib/dateUtils";

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
  hasActiveFeed: boolean;
}

type Step = "side" | "bottle_type" | "timing" | "manual";

export default function FeedModal({
  isOpen,
  onClose,
  onSaved,
  onError,
  hasActiveFeed,
}: FeedModalProps) {
  const [step, setStep] = useState<Step>("side");
  const [side, setSide] = useState<FeedSide | null>(null);
  const [bottleType, setBottleType] = useState<BottleType | null>(null);
  const [bottleOunces, setBottleOunces] = useState("1");
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
    setBottleType(null);
    setBottleOunces("1");
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
    setBottleType(null);
    setStep(selected === "bottle" ? "bottle_type" : "timing");
  };

  const handleSelectBottleType = (selected: BottleType) => {
    setBottleType(selected);
    setStep("timing");
  };

  const feedPayload = () => {
    if (!side) return null;
    return {
      feed_side: side,
      bottle_type: side === "bottle" ? bottleType : null,
    };
  };

  const handleStartNow = async () => {
    const payload = feedPayload();
    if (!payload) return;

    if (payload.feed_side === "bottle" && !payload.bottle_type) {
      onError("Please select Breast Milk or Formula");
      return;
    }

    if (hasActiveFeed) {
      onError("A feeding session is already in progress");
      return;
    }

    setLoading(true);
    try {
      await startFeed({
        ...payload,
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
    const payload = feedPayload();
    if (!payload) return;

    if (payload.feed_side === "bottle" && !payload.bottle_type) {
      setValidationError("Please select Breast Milk or Formula");
      return;
    }

    if (payload.feed_side === "bottle") {
      const ouncesError = validateBottleOunces(bottleOunces);
      if (ouncesError) {
        setValidationError(ouncesError);
        return;
      }
    }

    const error = validateFeedTimes(startLocal, endLocal);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setLoading(true);

    try {
      await createCompletedFeed({
        ...payload,
        feed_start_time: toISOFromLocalInput(startLocal),
        feed_end_time: toISOFromLocalInput(endLocal),
        bottle_ounces:
          payload.feed_side === "bottle"
            ? parseBottleOunces(bottleOunces)
            : null,
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
            {FEED_SIDES.map((feedSide) => (
              <button
                key={feedSide}
                type="button"
                onClick={() => handleSelectSide(feedSide)}
                className={`rounded-xl px-4 py-4 text-base font-semibold active:opacity-80 ${
                  feedSide === "bottle"
                    ? "bg-sky-100 text-sky-900"
                    : "bg-rose-100 text-rose-900"
                }`}
              >
                {getFeedSideButtonLabel(feedSide)}
              </button>
            ))}
          </div>
        )}

        {step === "bottle_type" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">What&apos;s in the bottle?</p>
            {BOTTLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectBottleType(type)}
                className="rounded-xl bg-sky-100 px-4 py-4 text-base font-semibold text-sky-900 active:bg-sky-200"
              >
                {getBottleTypeButtonLabel(type)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStep("side")}
              className="text-sm font-medium text-slate-500"
            >
              ← Change method
            </button>
          </div>
        )}

        {step === "timing" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              {getFeedMethodSelectedLabel(side, bottleType)}
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
              onClick={() =>
                setStep(side === "bottle" ? "bottle_type" : "side")
              }
              className="text-sm font-medium text-slate-500"
            >
              ← Back
            </button>
          </div>
        )}

        {step === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              {getFeedMethodSelectedLabel(side, bottleType).replace(
                " selected",
                ""
              )}
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
            {side === "bottle" && (
              <BottleOuncesInput
                id="manual-bottle-ounces"
                value={bottleOunces}
                onChange={(value) => {
                  setBottleOunces(value);
                  setValidationError(null);
                }}
              />
            )}
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
