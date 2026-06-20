"use client";

import { useState } from "react";
import { createDiaperEvent } from "@/lib/babyEvents";
import {
  nowISO,
  toISOFromLocalInput,
  toLocalInputValue,
  validateManualDateTime,
} from "@/lib/dateUtils";

interface EventModalProps {
  eventType: "wet_diaper" | "dirty_diaper";
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

type Step = "choice" | "earlier";

const titles: Record<EventModalProps["eventType"], string> = {
  wet_diaper: "Wet Diaper",
  dirty_diaper: "Dirty Diaper",
};

export default function EventModal({
  eventType,
  isOpen,
  onClose,
  onSaved,
  onError,
}: EventModalProps) {
  const [step, setStep] = useState<Step>("choice");
  const [localDateTime, setLocalDateTime] = useState(toLocalInputValue(nowISO()));
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const reset = () => {
    setStep("choice");
    setLocalDateTime(toLocalInputValue(nowISO()));
    setValidationError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saveEvent = async (occurredAt: string) => {
    setLoading(true);
    try {
      await createDiaperEvent({
        event_type: eventType,
        occurred_at: occurredAt,
      });
      reset();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const handleNow = () => saveEvent(nowISO());

  const handleEarlierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateManualDateTime(localDateTime);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    try {
      const iso = toISOFromLocalInput(localDateTime);
      await saveEvent(iso);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  const nowLabel =
    eventType === "wet_diaper" ? "Wet Now" : "Dirty Now";
  const earlierLabel =
    eventType === "wet_diaper" ? "Wet Earlier" : "Dirty Earlier";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {titles[eventType]}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 active:bg-slate-100"
          >
            Close
          </button>
        </div>

        {step === "choice" ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNow}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-4 py-4 text-base font-semibold text-white active:bg-slate-900 disabled:opacity-50"
            >
              {loading ? "Saving…" : nowLabel}
            </button>
            <button
              type="button"
              onClick={() => setStep("earlier")}
              disabled={loading}
              className="rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-800 active:bg-slate-50 disabled:opacity-50"
            >
              {earlierLabel}
            </button>
          </div>
        ) : (
          <form onSubmit={handleEarlierSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="diaper-time"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                When did it happen?
              </label>
              <input
                id="diaper-time"
                type="datetime-local"
                value={localDateTime}
                onChange={(e) => {
                  setLocalDateTime(e.target.value);
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
              />
              {validationError && (
                <p className="mt-2 text-sm text-red-600">{validationError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("choice")}
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
