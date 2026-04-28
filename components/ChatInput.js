import React, { useCallback, useRef, useEffect } from "react";

/**
 * Bottom input: Enter to send, Shift+Enter for newline, auto row height.
 */
export default function ChatInput({ value, onChange, onSend, disabled, placeholder }) {
  const ref = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && value?.trim()) {
          onSend();
        }
      }
    },
    [disabled, onSend, value]
  );

  // Auto height for textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(140, el.scrollHeight);
    el.style.height = `${next}px`;
  }, [value]);

  return (
    <div className="relative z-10 border-t border-white/5 bg-slate-950/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-2 pl-3 shadow-2xl ring-1 ring-white/5">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            className="min-h-11 max-h-36 w-full flex-1 resize-none bg-transparent py-2.5 pl-0.5 text-[0.9375rem] leading-snug text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !String(value).trim()}
            className="mb-0.5 flex h-11 min-w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-400 hover:to-fuchsia-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/80 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-40 disabled:shadow-none"
            aria-label="Send"
          >
            <svg
              className="h-5 w-5 translate-x-px"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[0.7rem] text-slate-600">
          Enter bhejne ke liye, Shift+Enter nayi line
        </p>
      </div>
    </div>
  );
}
