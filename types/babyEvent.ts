export type EventType = "wet_diaper" | "dirty_diaper" | "feed";
export type FeedSide = "left" | "right" | "bottle";
export type BottleType = "breast_milk" | "formula";

export const FEED_SIDES: FeedSide[] = ["left", "right", "bottle"];
export const BOTTLE_TYPES: BottleType[] = ["breast_milk", "formula"];

export interface BabyEvent {
  id: string;
  user_id: string | null;
  baby_id: string | null;
  event_type: EventType;
  occurred_at: string;
  feed_side: FeedSide | null;
  bottle_type: BottleType | null;
  feed_start_time: string | null;
  feed_end_time: string | null;
  feed_paused_at: string | null;
  feed_paused_seconds: number;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiaperEventInput {
  event_type: "wet_diaper" | "dirty_diaper";
  occurred_at: string;
}

export interface CreateFeedEventInput {
  feed_side: FeedSide;
  feed_start_time: string;
  feed_end_time?: string | null;
  bottle_type?: BottleType | null;
}

export interface UpdateBabyEventInput {
  occurred_at?: string;
  feed_side?: FeedSide;
  bottle_type?: BottleType | null;
  feed_start_time?: string;
  feed_end_time?: string | null;
  duration_minutes?: number | null;
}
