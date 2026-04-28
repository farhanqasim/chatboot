"use client";

import React, { useCallback, useEffect } from "react";

/**
 * @typedef {{ id: string, title: string, updatedAt: number }} ChatMeta
 */

/**
 * @param {object} props
 * @param {ChatMeta[]} props.chats
 * @param {string} props.activeId
 * @param {(id: string) => void} props.onSelect
 * @param {() => void} props.onNewChat
 * @param {boolean} props.isOpenMobile
 * @param {() => void} props.onCloseMobile
 * @param {boolean} [props.isBusy]
 */
export default function ChatSidebar({
  chats,
  activeId,
  onSelect,
  onNewChat,
  isOpenMobile,
  onCloseMobile,
  isBusy = false,
}) {
  // Close on Escape when mobile overlay
  useEffect(() => {
    if (!isOpenMobile) return;
    const h = (e) => e.key === "Escape" && onCloseMobile();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpenMobile, onCloseMobile]);

  const handleSelect = useCallback(
    (id) => {
      onSelect(id);
      onCloseMobile();
    },
    [onSelect, onCloseMobile]
  );

  const list = (
    <div
      className="flex h-full min-h-0 flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shrink-0 p-2">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          disabled={isBusy}
          className="w-full rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/80 px-3 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-wait disabled:opacity-50"
        >
          + Naya chat
        </button>
      </div>
      <p className="shrink-0 px-3 pb-1 text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
        Pehle ki batein
      </p>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-3" role="list">
        {chats.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c.id)}
                disabled={isBusy}
                className={[
                  "w-full rounded-lg px-2.5 py-2.5 text-left text-sm transition disabled:opacity-50",
                  active
                    ? "bg-white/10 font-medium text-white ring-1 ring-violet-500/40"
                    : "text-slate-300 hover:bg-white/5",
                ].join(" ")}
              >
                <span className="line-clamp-2 pr-1">{c.title || "Chat"}</span>
                <span className="mt-0.5 block text-[0.65rem] text-slate-500">
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(c.updatedAt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet: fixed column */}
      <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-slate-950/50 md:flex md:flex-col">
        {list}
      </aside>

      {/* Mobile: overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 p-0 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          role="dialog"
          aria-label="Chats"
        >
          <div
            className="h-full w-[min(100%,18rem)] border-r border-white/10 bg-slate-950/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {list}
          </div>
        </div>
      )}
    </>
  );
}
