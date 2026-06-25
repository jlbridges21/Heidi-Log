"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_PADDING_ROWS = Math.floor(WHEEL_VISIBLE_ROWS / 2);
const MAX_WHOLE_OUNCES = 50;

interface BottleOuncesInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

function parseOuncesValue(value: string): { whole: number; decimal: number } {
  if (!value.trim()) {
    return { whole: 1, decimal: 0 };
  }

  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    return { whole: 1, decimal: 0 };
  }

  const whole = Math.min(MAX_WHOLE_OUNCES, Math.floor(num));
  const decimal = Math.min(9, Math.round((num - whole) * 10));

  return { whole, decimal };
}

export function combineOuncesParts(whole: number, decimal: number): string {
  if (decimal === 0) {
    return String(whole);
  }

  return `${whole}.${decimal}`;
}

function formatDecimalLabel(digit: number): string {
  return `.${digit}`;
}

interface WheelColumnProps<T extends number> {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  formatItem: (item: T) => string;
  ariaLabel: string;
}

function WheelColumn<T extends number>({
  items,
  value,
  onChange,
  formatItem,
  ariaLabel,
}: WheelColumnProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScroll = useRef(false);

  const scrollToValue = useCallback(
    (nextValue: T, smooth = false) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const index = items.indexOf(nextValue);
      if (index < 0) return;

      isProgrammaticScroll.current = true;
      scroller.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "auto",
      });

      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, smooth ? 200 : 0);
    },
    [items]
  );

  useEffect(() => {
    scrollToValue(value);
  }, [value, scrollToValue]);

  const snapToNearest = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const index = Math.max(
      0,
      Math.min(items.length - 1, Math.round(scroller.scrollTop / ITEM_HEIGHT))
    );

    scroller.scrollTop = index * ITEM_HEIGHT;

    const nextValue = items[index];
    if (nextValue !== value) {
      onChange(nextValue);
    }
  }, [items, onChange, value]);

  const handleScroll = () => {
    if (isProgrammaticScroll.current) {
      return;
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(snapToNearest, 80);
  };

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    },
    []
  );

  return (
    <div
      className="relative h-[220px] flex-1 overflow-hidden"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchEnd={snapToNearest}
        onMouseUp={snapToNearest}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingTop: WHEEL_PADDING_ROWS * ITEM_HEIGHT,
          paddingBottom: WHEEL_PADDING_ROWS * ITEM_HEIGHT,
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            className="flex h-11 snap-center snap-always items-center justify-center text-2xl font-semibold tabular-nums text-slate-400 transition-colors duration-150 data-[selected=true]:scale-105 data-[selected=true]:font-bold data-[selected=true]:text-sky-900"
            data-selected={item === value}
            style={{ height: ITEM_HEIGHT }}
          >
            {formatItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BottleOuncesInput({
  id = "bottle-ounces",
  value,
  onChange,
  error,
}: BottleOuncesInputProps) {
  const parsed = parseOuncesValue(value);
  const [whole, setWhole] = useState(parsed.whole);
  const [decimal, setDecimal] = useState(parsed.decimal);

  const wholeOptions = Array.from(
    { length: MAX_WHOLE_OUNCES + 1 },
    (_, index) => index
  );
  const decimalOptions = Array.from({ length: 10 }, (_, index) => index);

  useEffect(() => {
    const next = parseOuncesValue(value);
    setWhole(next.whole);
    setDecimal(next.decimal);
  }, [value]);

  const updateWhole = (nextWhole: number) => {
    setWhole(nextWhole);
    onChange(combineOuncesParts(nextWhole, decimal));
  };

  const updateDecimal = (nextDecimal: number) => {
    setDecimal(nextDecimal);
    onChange(combineOuncesParts(whole, nextDecimal));
  };

  const displayValue = combineOuncesParts(whole, decimal);

  return (
    <div id={id}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Ounces consumed
      </label>

      <p className="mb-3 text-center text-3xl font-bold tabular-nums text-sky-900">
        {displayValue}{" "}
        <span className="text-lg font-semibold text-sky-600">oz</span>
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl border border-sky-200 bg-sky-100/70 shadow-sm" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-sky-50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-sky-50 to-transparent" />

        <div className="relative z-0 flex items-stretch px-1 py-2">
          <WheelColumn
            items={wholeOptions}
            value={whole}
            onChange={updateWhole}
            formatItem={(item) => String(item)}
            ariaLabel="Whole ounces"
          />
          <WheelColumn
            items={decimalOptions}
            value={decimal}
            onChange={updateDecimal}
            formatItem={formatDecimalLabel}
            ariaLabel="Decimal ounces"
          />
          <div className="flex w-14 items-center justify-center text-xl font-semibold text-sky-700">
            oz
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-500">
        Scroll to select amount
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
