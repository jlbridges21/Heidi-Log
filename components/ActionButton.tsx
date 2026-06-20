"use client";

import type { ReactNode } from "react";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: "wet" | "dirty" | "feed" | "log" | "default";
  disabled?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<
  NonNullable<ActionButtonProps["variant"]>,
  string
> = {
  wet: "bg-sky-100 text-sky-900 border-sky-200 active:bg-sky-200",
  dirty: "bg-amber-100 text-amber-900 border-amber-200 active:bg-amber-200",
  feed: "bg-rose-100 text-rose-900 border-rose-200 active:bg-rose-200",
  log: "bg-violet-100 text-violet-900 border-violet-200 active:bg-violet-200",
  default: "bg-white text-slate-800 border-slate-200 active:bg-slate-50",
};

export default function ActionButton({
  label,
  onClick,
  variant = "default",
  disabled = false,
  icon,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-6 text-lg font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]}`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {label}
    </button>
  );
}
