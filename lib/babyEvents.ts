import type {
  BabyEvent,
  CreateDiaperEventInput,
  CreateFeedEventInput,
  UpdateBabyEventInput,
} from "@/types/babyEvent";
import {
  calculateDurationMinutes,
  calculateFeedDurationMinutes,
} from "@/lib/dateUtils";
import { getSupabaseClient } from "@/lib/supabaseClient";

function feedMethodFields(input: {
  feed_side: CreateFeedEventInput["feed_side"];
  bottle_type?: CreateFeedEventInput["bottle_type"];
}) {
  return {
    feed_side: input.feed_side,
    bottle_type:
      input.feed_side === "bottle" ? (input.bottle_type ?? null) : null,
  };
}

export async function fetchAllEvents(): Promise<BabyEvent[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BabyEvent[];
}

export async function fetchActiveFeed(): Promise<BabyEvent | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .select("*")
    .eq("event_type", "feed")
    .is("feed_end_time", null)
    .order("feed_start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent | null;
}

export async function fetchLastFeed(): Promise<BabyEvent | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .select("*")
    .eq("event_type", "feed")
    .not("feed_end_time", "is", null)
    .order("feed_end_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent | null;
}

export async function createDiaperEvent(
  input: CreateDiaperEventInput
): Promise<BabyEvent> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .insert({
      event_type: input.event_type,
      occurred_at: input.occurred_at,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function startFeed(input: {
  feed_side: CreateFeedEventInput["feed_side"];
  feed_start_time: string;
  bottle_type?: CreateFeedEventInput["bottle_type"];
}): Promise<BabyEvent> {
  const active = await fetchActiveFeed();

  if (active) {
    throw new Error("A feeding session is already in progress");
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .insert({
      event_type: "feed",
      occurred_at: input.feed_start_time,
      ...feedMethodFields(input),
      feed_start_time: input.feed_start_time,
      feed_end_time: null,
      feed_paused_at: null,
      feed_paused_seconds: 0,
      duration_minutes: null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function endFeed(
  feedId: string,
  endTime: string,
  options?: { bottle_ounces?: number }
): Promise<BabyEvent> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("baby_events")
    .select("*")
    .eq("id", feedId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const feed = existing as BabyEvent;

  if (!feed.feed_start_time) {
    throw new Error("Feed is missing a start time");
  }

  if (feed.feed_side === "bottle") {
    if (options?.bottle_ounces == null || options.bottle_ounces <= 0) {
      throw new Error("Please enter the number of ounces");
    }
  }

  let pausedSeconds = feed.feed_paused_seconds ?? 0;
  if (feed.feed_paused_at) {
    pausedSeconds += Math.floor(
      (new Date(endTime).getTime() - new Date(feed.feed_paused_at).getTime()) /
        1000
    );
  }

  const duration = calculateFeedDurationMinutes(
    feed.feed_start_time,
    endTime,
    pausedSeconds
  );

  const { data, error } = await supabase
    .from("baby_events")
    .update({
      feed_end_time: endTime,
      feed_paused_at: null,
      feed_paused_seconds: pausedSeconds,
      duration_minutes: duration,
      bottle_ounces:
        feed.feed_side === "bottle" ? options?.bottle_ounces ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function pauseFeed(feedId: string): Promise<BabyEvent> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("baby_events")
    .select("*")
    .eq("id", feedId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const feed = existing as BabyEvent;

  if (feed.feed_paused_at) {
    throw new Error("Feeding is already paused");
  }

  const { data, error } = await supabase
    .from("baby_events")
    .update({
      feed_paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function resumeFeed(feedId: string): Promise<BabyEvent> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("baby_events")
    .select("*")
    .eq("id", feedId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const feed = existing as BabyEvent;

  if (!feed.feed_paused_at) {
    throw new Error("Feeding is not paused");
  }

  const pauseDurationSeconds = Math.floor(
    (Date.now() - new Date(feed.feed_paused_at).getTime()) / 1000
  );

  const { data, error } = await supabase
    .from("baby_events")
    .update({
      feed_paused_at: null,
      feed_paused_seconds:
        (feed.feed_paused_seconds ?? 0) + pauseDurationSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function createCompletedFeed(
  input: CreateFeedEventInput & { feed_end_time: string }
): Promise<BabyEvent> {
  const active = await fetchActiveFeed();

  if (active) {
    throw new Error("A feeding session is already in progress");
  }

  if (input.feed_side === "bottle") {
    if (input.bottle_ounces == null || input.bottle_ounces <= 0) {
      throw new Error("Please enter the number of ounces");
    }
  }

  const duration = calculateDurationMinutes(
    input.feed_start_time,
    input.feed_end_time
  );

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("baby_events")
    .insert({
      event_type: "feed",
      occurred_at: input.feed_start_time,
      ...feedMethodFields(input),
      feed_start_time: input.feed_start_time,
      feed_end_time: input.feed_end_time,
      bottle_ounces:
        input.feed_side === "bottle" ? (input.bottle_ounces ?? null) : null,
      duration_minutes: duration,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function updateEvent(
  id: string,
  input: UpdateBabyEventInput
): Promise<BabyEvent> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("baby_events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const event = existing as BabyEvent;

  const updates: UpdateBabyEventInput & { updated_at: string } = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (event.event_type === "feed") {
    const start =
      input.feed_start_time ?? event.feed_start_time ?? event.occurred_at;

    const end =
      input.feed_end_time !== undefined
        ? input.feed_end_time
        : event.feed_end_time;

    const feedSide = input.feed_side ?? event.feed_side;

    if (feedSide !== "bottle") {
      updates.bottle_type = null;
      updates.bottle_ounces = null;
    } else {
      if (input.bottle_type !== undefined) {
        updates.bottle_type = input.bottle_type;
      }
      if (input.bottle_ounces !== undefined) {
        updates.bottle_ounces = input.bottle_ounces;
      }
    }

    if (start) {
      updates.occurred_at = start;
      updates.feed_start_time = start;
    }

    if (end && start) {
      updates.duration_minutes = calculateDurationMinutes(start, end);
    } else {
      updates.duration_minutes = null;
    }
  } else if (input.occurred_at) {
    updates.occurred_at = input.occurred_at;
  }

  const { data, error } = await supabase
    .from("baby_events")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BabyEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("baby_events").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}