import type {
  BabyEvent,
  CreateDiaperEventInput,
  CreateFeedEventInput,
  UpdateBabyEventInput,
} from "@/types/babyEvent";
import { calculateDurationMinutes } from "@/lib/dateUtils";
import { getSupabaseClient } from "@/lib/supabaseClient";

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
    .order("feed_start_time", { ascending: false })
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
      feed_side: input.feed_side,
      feed_start_time: input.feed_start_time,
      feed_end_time: null,
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
  endTime: string
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

  const duration = calculateDurationMinutes(feed.feed_start_time, endTime);

  const { data, error } = await supabase
    .from("baby_events")
    .update({
      feed_end_time: endTime,
      duration_minutes: duration,
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
      feed_side: input.feed_side,
      feed_start_time: input.feed_start_time,
      feed_end_time: input.feed_end_time,
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