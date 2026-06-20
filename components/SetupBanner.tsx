"use client";

interface SetupBannerProps {
  message: string;
}

export default function SetupBanner({ message }: SetupBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Setup required</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
