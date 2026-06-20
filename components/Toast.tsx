"use client";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-[60] mx-auto max-w-md rounded-xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
        type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-2 py-1 text-white/80 active:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
