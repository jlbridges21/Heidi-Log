import type { BabyEvent } from "@/types/babyEvent";

function getFeedStartTime(feed: BabyEvent): string {
  return feed.feed_start_time ?? feed.occurred_at;
}

function getPreviousFeedEndTime(feed: BabyEvent): string {
  return feed.feed_end_time ?? feed.feed_start_time ?? feed.occurred_at;
}

export function formatTimeBetweenFeedings(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${minutes} min between feedings`;
  }

  if (remainingMinutes === 0) {
    return hours === 1
      ? "1 hr between feedings"
      : `${hours} hr between feedings`;
  }

  return `${hours} hr ${remainingMinutes} min between feedings`;
}

export function buildFeedGapMap(events: BabyEvent[]): Map<string, string> {
  const gaps = new Map<string, string>();

  const feeds = events
    .filter((event) => event.event_type === "feed")
    .sort(
      (a, b) =>
        new Date(getFeedStartTime(a)).getTime() -
        new Date(getFeedStartTime(b)).getTime()
    );

  for (let index = 1; index < feeds.length; index += 1) {
    const previousFeed = feeds[index - 1];
    const currentFeed = feeds[index];

    const previousEnd = new Date(getPreviousFeedEndTime(previousFeed)).getTime();
    const currentStart = new Date(getFeedStartTime(currentFeed)).getTime();
    const diffMinutes = Math.floor((currentStart - previousEnd) / 60000);

    gaps.set(currentFeed.id, formatTimeBetweenFeedings(diffMinutes));
  }

  return gaps;
}
