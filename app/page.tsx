"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import ActiveFeedCard from "@/components/ActiveFeedCard";
import EventModal from "@/components/EventModal";
import FeedModal from "@/components/FeedModal";
import SetupBanner from "@/components/SetupBanner";
import Toast from "@/components/Toast";
import { fetchActiveFeed, fetchLastFeed } from "@/lib/babyEvents";
import { formatLastFedSummary } from "@/lib/dateUtils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { BabyEvent } from "@/types/babyEvent";

type ModalType = "wet" | "dirty" | "feed" | null;

export default function DashboardPage() {
  const router = useRouter();
  const [activeFeed, setActiveFeed] = useState<BabyEvent | null>(null);
  const [lastFeed, setLastFeed] = useState<BabyEvent | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<ModalType>(null);
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

  const loadFeedData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const [active, last] = await Promise.all([
        fetchActiveFeed(),
        fetchLastFeed(),
      ]);

      setActiveFeed(active);
      setLastFeed(last);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load feed data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSaved = () => {
    setOpenModal(null);
    showToast("Saved!", "success");
    loadFeedData();
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Baby Log</h1>
          <p className="mt-2 text-slate-600">
            Simple tracking for tired parents
          </p>
        </header>
        <SetupBanner message="Copy .env.example to .env.local and add your Supabase URL and anon key. See README for full setup steps." />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8 pb-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Baby Log</h1>
        <p className="mt-2 px-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {activeFeed
            ? "Feeding in progress"
            : formatLastFedSummary(lastFeed, now)}
        </p>
      </header>

      {loading ? (
        <div className="mb-6 rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
          Loading…
        </div>
      ) : (
        activeFeed && (
          <div className="mb-6">
            <ActiveFeedCard
              activeFeed={activeFeed}
              onEnded={() => {
                showToast("Feeding saved!", "success");
                loadFeedData();
              }}
              onUpdated={(feed) => setActiveFeed(feed)}
              onError={(msg) => showToast(msg, "error")}
            />
          </div>
        )
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionButton
          label="Wet Diaper"
          variant="wet"
          icon="💧"
          onClick={() => setOpenModal("wet")}
        />
        <ActionButton
          label="Dirty Diaper"
          variant="dirty"
          icon="💩"
          onClick={() => setOpenModal("dirty")}
        />
        <ActionButton
          label="Feed"
          variant="feed"
          icon="🍼"
          onClick={() => setOpenModal("feed")}
        />
        <ActionButton
          label="Baby Log"
          variant="log"
          icon="📋"
          onClick={() => router.push("/log")}
        />
      </div>

      <EventModal
        eventType="wet_diaper"
        isOpen={openModal === "wet"}
        onClose={() => setOpenModal(null)}
        onSaved={handleSaved}
        onError={(msg) => showToast(msg, "error")}
      />

      <EventModal
        eventType="dirty_diaper"
        isOpen={openModal === "dirty"}
        onClose={() => setOpenModal(null)}
        onSaved={handleSaved}
        onError={(msg) => showToast(msg, "error")}
      />

      <FeedModal
        isOpen={openModal === "feed"}
        onClose={() => setOpenModal(null)}
        onSaved={handleSaved}
        onError={(msg) => showToast(msg, "error")}
        hasActiveFeed={!!activeFeed}
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