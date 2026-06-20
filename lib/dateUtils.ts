/**
 * Date/time utilities for Baby Log.
 * All storage is UTC via Supabase; display uses the user's local timezone.
 */

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
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
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
    default:
      return "—";
  }
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
