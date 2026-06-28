"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EditEventModal from "@/components/EditEventModal";
import LogItem from "@/components/LogItem";
import SetupBanner from "@/components/SetupBanner";
import Toast from "@/components/Toast";
import { deleteEvent, fetchAllEvents } from "@/lib/babyEvents";
import { buildFeedGapMap } from "@/lib/feedGaps";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { BabyEvent } from "@/types/babyEvent";

export default function LogPage() {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<BabyEvent | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchAllEvents();
      setEvents(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load log",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const feedGapMap = useMemo(() => buildFeedGapMap(events), [events]);

  const handleDelete = async (event: BabyEvent) => {
    const label =
      event.event_type === "feed"
        ? "this feeding"
        : event.event_type === "wet_diaper"
          ? "this wet diaper entry"
          : "this dirty diaper entry";

    const confirmed = window.confirm(
      `Delete ${label}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event.id);
      showToast("Entry deleted", "success");
      loadEvents();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete entry",
        "error"
      );
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
        <header className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-violet-600 active:text-violet-800"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Baby Log</h1>
        </header>
        <SetupBanner message="Configure Supabase in .env.local to view the log." />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8 pb-12">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-violet-600 active:text-violet-800"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Baby Log</h1>
        <p className="mt-1 text-sm text-slate-600">Newest entries first</p>
      </header>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading entries…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-700">No entries yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Log a diaper change or feeding from the dashboard.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white active:bg-violet-600"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {events.map((event) => {
            const gapLabel =
              event.event_type === "feed"
                ? feedGapMap.get(event.id)
                : undefined;

            return (
              <div key={event.id} className="mb-3">
                <LogItem
                  event={event}
                  onEdit={setEditingEvent}
                  onDelete={handleDelete}
                />
                {gapLabel && (
                  <p className="mt-2 mb-3 text-center text-lg font-semibold text-[#222021]">
                    {gapLabel}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSaved={() => {
          setEditingEvent(null);
          showToast("Entry updated!", "success");
          loadEvents();
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}
