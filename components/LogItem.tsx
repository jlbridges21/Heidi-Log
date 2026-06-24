"use client";

import type { BabyEvent } from "@/types/babyEvent";
import {
  formatDateTime,
  formatDuration,
  formatTime,
  getEventTypeLabel,
  getFeedSideLabel,
} from "@/lib/dateUtils";

interface LogItemProps {
  event: BabyEvent;
  onEdit: (event: BabyEvent) => void;
  onDelete: (event: BabyEvent) => void;
}

export default function LogItem({ event, onEdit, onDelete }: LogItemProps) {
  const isActiveFeed =
    event.event_type === "feed" && event.feed_end_time === null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                event.event_type === "wet_diaper"
                  ? "bg-sky-100 text-sky-800"
                  : event.event_type === "dirty_diaper"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
              }`}
            >
              {getEventTypeLabel(event.event_type)}
            </span>
            {isActiveFeed && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                In progress
              </span>
            )}
          </div>
          <p className="mt-2 text-base font-medium text-slate-800">
            {formatDateTime(event.occurred_at)}
          </p>
        </div>
      </div>

      {event.event_type === "feed" && (
        <div className="mb-4 space-y-1 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Method:</span>{" "}
            {getFeedSideLabel(event.feed_side)}
          </p>
          {event.feed_start_time && (
            <p>
              <span className="font-medium text-slate-700">Start:</span>{" "}
              {formatTime(event.feed_start_time)}
            </p>
          )}
          {event.feed_end_time ? (
            <>
              <p>
                <span className="font-medium text-slate-700">End:</span>{" "}
                {formatTime(event.feed_end_time)}
              </p>
              <p>
                <span className="font-medium text-slate-700">Duration:</span>{" "}
                {formatDuration(event.duration_minutes)}
              </p>
            </>
          ) : (
            <p className="text-green-700">Feeding still in progress</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(event)}
          className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 active:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
