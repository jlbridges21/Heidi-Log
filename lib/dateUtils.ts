/**
 * Date/time utilities for Baby Log.
 * All storage is UTC via Supabase; display uses the user's local timezone.
 */

import type { BabyEvent } from "@/types/babyEvent";

export function nowISO(): string {
  return new Date().toISOString();
}

export function toISOFromLocalInput(localDateTime: string): string {
  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date/time");
  }
  return date.toISOString();
}

export function toLocalInputValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid time";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes < 0) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

export function calculateDurationMinutes(
  startISO: string,
  endISO: string
): number {
  const start = new Date(startISO);
  const end = new Date(endISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end time");
  }

  if (end < start) {
    throw new Error("End time cannot be before start time");
  }

  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function calculateFeedDurationMinutes(
  startISO: string,
  endISO: string,
  pausedSeconds = 0
): number {
  const start = new Date(startISO);
  const end = new Date(endISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end time");
  }

  if (end < start) {
    throw new Error("End time cannot be before start time");
  }

  const activeMs = end.getTime() - start.getTime() - pausedSeconds * 1000;
  return Math.round(Math.max(0, activeMs) / 60000);
}

function formatSecondsAsElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

export function getFeedActiveSeconds(
  startISO: string,
  pausedAtISO: string | null,
  pausedSeconds: number,
  now = new Date()
): number {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  let totalPausedMs = pausedSeconds * 1000;
  if (pausedAtISO) {
    totalPausedMs += now.getTime() - new Date(pausedAtISO).getTime();
  }

  return Math.max(0, Math.floor((now.getTime() - start.getTime() - totalPausedMs) / 1000));
}

export function formatElapsed(startISO: string): string {
  const start = new Date(startISO);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    return "0:00";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / 1000)
  );

  return formatSecondsAsElapsed(totalSeconds);
}

export function formatFeedElapsed(
  startISO: string,
  pausedAtISO: string | null,
  pausedSeconds: number
): string {
  return formatSecondsAsElapsed(
    getFeedActiveSeconds(startISO, pausedAtISO, pausedSeconds)
  );
}

export function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "wet_diaper":
      return "Wet Diaper";
    case "dirty_diaper":
      return "Dirty Diaper";
    case "feed":
      return "Feed";
    default:
      return eventType;
  }
}

export function getFeedSideLabel(side: string | null): string {
  switch (side) {
    case "left":
      return "Left";
    case "right":
      return "Right";
    case "bottle":
      return "Bottle";
    default:
      return "—";
  }
}

export function getFeedSideButtonLabel(side: string): string {
  switch (side) {
    case "left":
      return "Left Boob";
    case "right":
      return "Right Boob";
    case "bottle":
      return "Bottle";
    default:
      return side;
  }
}

export function getBottleTypeLabel(type: string | null): string {
  switch (type) {
    case "breast_milk":
      return "Breast Milk";
    case "formula":
      return "Formula";
    default:
      return "—";
  }
}

export function getBottleTypeButtonLabel(type: string): string {
  return getBottleTypeLabel(type);
}

export function getFeedMethodSelectedLabel(
  side: string | null,
  bottleType: string | null = null
): string {
  switch (side) {
    case "left":
      return "Left side selected";
    case "right":
      return "Right side selected";
    case "bottle":
      return bottleType
        ? `${getBottleTypeLabel(bottleType)} bottle selected`
        : "Bottle selected";
    default:
      return "Feed method selected";
  }
}

export function getActiveFeedMethodLabel(
  side: string | null,
  bottleType: string | null = null
): string {
  switch (side) {
    case "left":
      return "Left side";
    case "right":
      return "Right side";
    case "bottle":
      return bottleType
        ? `Bottle · ${getBottleTypeLabel(bottleType)}`
        : "Bottle";
    default:
      return "—";
  }
}

function getLastFeedMethodPhrase(
  side: string | null,
  bottleType: string | null = null
): string {
  switch (side) {
    case "left":
      return "on the Left boob";
    case "right":
      return "on the Right boob";
    case "bottle":
      return bottleType
        ? `with a ${getBottleTypeLabel(bottleType)} bottle`
        : "with a bottle";
    default:
      return "";
  }
}

function formatTimeAgo(diffMs: number): string {
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalMinutes < 1) return "just now";
  if (hours === 0) return `${minutes} min ago`;
  if (minutes === 0) return `${hours} hr ago`;
  return `${hours} hr ${minutes} min ago`;
}

function formatFeedDurationSummary(durationMinutes: number): string {
  if (durationMinutes === 1) return "1 minute";
  if (durationMinutes < 60) return `${durationMinutes} minutes`;

  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  if (mins === 0) {
    return hrs === 1 ? "1 hour" : `${hrs} hours`;
  }

  return `${hrs} hr ${mins} min`;
}

function getLastFeedDurationMinutes(feed: BabyEvent): number | null {
  if (feed.duration_minutes !== null && feed.duration_minutes >= 0) {
    return feed.duration_minutes;
  }

  if (feed.feed_start_time && feed.feed_end_time) {
    return calculateFeedDurationMinutes(
      feed.feed_start_time,
      feed.feed_end_time,
      feed.feed_paused_seconds ?? 0
    );
  }

  return null;
}

export function formatLastFedSummary(
  feed: BabyEvent | null,
  currentTime = new Date()
): string {
  if (!feed?.feed_end_time) {
    return "No feedings logged yet";
  }

  const endTime = new Date(feed.feed_end_time);
  if (Number.isNaN(endTime.getTime())) {
    return "No feedings logged yet";
  }

  const diffMs = currentTime.getTime() - endTime.getTime();
  if (diffMs < 0) {
    return "Last feeding time looks incorrect";
  }

  const agoPart = formatTimeAgo(diffMs);
  const durationMinutes = getLastFeedDurationMinutes(feed);
  const methodPhrase = getLastFeedMethodPhrase(
    feed.feed_side,
    feed.bottle_type
  );
  const ouncesPart =
    feed.feed_side === "bottle" && feed.bottle_ounces != null
      ? formatBottleOunces(Number(feed.bottle_ounces))
      : null;

  if (feed.feed_side === "bottle" && ouncesPart) {
    const durationPart =
      durationMinutes !== null
        ? formatFeedDurationSummary(durationMinutes)
        : null;

    if (durationPart && methodPhrase) {
      return `Last fed ${ouncesPart} ${agoPart} for ${durationPart} ${methodPhrase}`;
    }

    if (methodPhrase) {
      return `Last fed ${ouncesPart} ${agoPart} ${methodPhrase}`;
    }

    return `Last fed ${ouncesPart} ${agoPart}`;
  }

  if (!methodPhrase) {
    return durationMinutes === null
      ? `Last fed ${agoPart}`
      : `Last fed ${agoPart} for ${formatFeedDurationSummary(durationMinutes)}`;
  }

  if (durationMinutes === null) {
    return `Last fed ${agoPart} ${methodPhrase}`;
  }

  const durationPart = formatFeedDurationSummary(durationMinutes);
  return `Last fed ${agoPart} for ${durationPart} ${methodPhrase}`;
}

export function validateManualDateTime(localDateTime: string): string | null {
  if (!localDateTime) {
    return "Please select a date and time";
  }

  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date/time";
  }

  return null;
}

export function validateFeedTimes(
  startLocal: string,
  endLocal: string
): string | null {
  const startError = validateManualDateTime(startLocal);
  if (startError) {
    return startError;
  }

  const endError = validateManualDateTime(endLocal);
  if (endError) {
    return endError;
  }

  const start = new Date(startLocal);
  const end = new Date(endLocal);

  if (end < start) {
    return "End time cannot be before start time";
  }

  return null;
}

export function formatBottleOunces(ounces: number): string {
  const rounded = Math.round(ounces * 10) / 10;
  const display = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(/\.0$/, "");

  return rounded === 1 ? `${display} ounce` : `${display} ounces`;
}

export function validateBottleOunces(value: string): string | null {
  if (!value.trim()) {
    return "Please select the number of ounces";
  }

  const ounces = Number(value);
  if (Number.isNaN(ounces)) {
    return "Please select a valid amount";
  }

  if (ounces <= 0) {
    return "Amount must be greater than 0 oz";
  }

  if (ounces > 50) {
    return "That amount seems too large";
  }

  return null;
}

export function parseBottleOunces(value: string): number {
  return Math.round(Number(value) * 100) / 100;
}

/**
 * When a feed is ended while paused, the effective end time is the pause
 * timestamp so post-pause waiting time is not counted as feeding time.
 */
export function resolveFeedEndTime(
  feed: {
    feed_paused_at: string | null;
    feed_paused_seconds: number;
  },
  requestedEndTime: string
): { endTime: string; pausedSeconds: number } {
  const pausedSeconds = feed.feed_paused_seconds ?? 0;

  if (feed.feed_paused_at) {
    return {
      endTime: feed.feed_paused_at,
      pausedSeconds,
    };
  }

  return {
    endTime: requestedEndTime,
    pausedSeconds,
  };
}
