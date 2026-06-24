"use client";

interface BottleOuncesInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoFocus?: boolean;
}

export default function BottleOuncesInput({
  id = "bottle-ounces",
  value,
  onChange,
  error,
  autoFocus = false,
}: BottleOuncesInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Ounces consumed
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0.1"
          max="50"
          placeholder="e.g. 2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-slate-300 px-4 py-4 text-2xl font-semibold text-slate-900"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
          oz
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
