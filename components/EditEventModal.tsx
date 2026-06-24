"use client";

import { useEffect, useState } from "react";
import type { BabyEvent, FeedSide } from "@/types/babyEvent";
import { FEED_SIDES } from "@/types/babyEvent";
import { updateEvent } from "@/lib/babyEvents";
import {
  getFeedSideButtonLabel,
  toISOFromLocalInput,
  toLocalInputValue,
  validateFeedTimes,
  validateManualDateTime,
} from "@/lib/dateUtils";

interface EditEventModalProps {
  event: BabyEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onSaved,
  onError,
}: EditEventModalProps) {
  const [occurredLocal, setOccurredLocal] = useState("");
  const [feedSide, setFeedSide] = useState<FeedSide>("left");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;

    setOccurredLocal(toLocalInputValue(event.occurred_at));
    setFeedSide(event.feed_side ?? "left");
    setStartLocal(
      toLocalInputValue(event.feed_start_time ?? event.occurred_at)
    );
    setEndLocal(
      event.feed_end_time ? toLocalInputValue(event.feed_end_time) : ""
    );
    setValidationError(null);
  }, [event]);

  if (!isOpen || !event) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError(null);

    try {
      if (event.event_type === "feed") {
        const startError = validateManualDateTime(startLocal);
        if (startError) {
          setValidationError(startError);
          setLoading(false);
          return;
        }

        if (endLocal) {
          const error = validateFeedTimes(startLocal, endLocal);
          if (error) {
            setValidationError(error);
            setLoading(false);
            return;
          }

          await updateEvent(event.id, {
            feed_side: feedSide,
            feed_start_time: toISOFromLocalInput(startLocal),
            feed_end_time: toISOFromLocalInput(endLocal),
          });
        } else if (isActiveFeed) {
          await updateEvent(event.id, {
            feed_side: feedSide,
            feed_start_time: toISOFromLocalInput(startLocal),
            feed_end_time: null,
          });
        } else {
          setValidationError("End time is required for completed feeds");
          setLoading(false);
          return;
        }
      } else {
        const error = validateManualDateTime(occurredLocal);
        if (error) {
          setValidationError(error);
          setLoading(false);
          return;
        }

        await updateEvent(event.id, {
          occurred_at: toISOFromLocalInput(occurredLocal),
        });
      }

      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setLoading(false);
    }
  };

  const isActiveFeed =
    event.event_type === "feed" && event.feed_end_time === null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Edit Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 active:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {event.event_type === "feed" ? (
            <>
              {isActiveFeed && (
                <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
                  This feed is still in progress. Set an end time to complete it.
                </p>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Method
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {FEED_SIDES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFeedSide(s)}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
                        feedSide === s
                          ? s === "bottle"
                            ? "bg-sky-500 text-white"
                            : "bg-rose-500 text-white"
                          : s === "bottle"
                            ? "bg-sky-50 text-sky-900"
                            : "bg-rose-50 text-rose-900"
                      }`}
                    >
                      {getFeedSideButtonLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="edit-start"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Start time
                </label>
                <input
                  id="edit-start"
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
                  htmlFor="edit-end"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  End time
                </label>
                <input
                  id="edit-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => {
                    setEndLocal(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
                />
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="edit-occurred"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Time
              </label>
              <input
                id="edit-occurred"
                type="datetime-local"
                value={occurredLocal}
                onChange={(e) => {
                  setOccurredLocal(e.target.value);
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
            </div>
          )}

          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-800 px-4 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
