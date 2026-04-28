"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatSidebar from "./ChatSidebar";

const STORAGE_V1 = "13-next-app-chat-messages-v1";
const STORAGE_V2 = "13-next-app-chats-v2";

const initialMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Assalam-o-alaikum!\n\n" +
    "Main aapke saath yahan chat kar sakta hoon. Urdu, English ya Roman Urdu — jaisa aap likhein, jawab waisa hi aayega. App plan, code, sawaal — kuch bhi poochh sakte hain.",
};

function isValidMessageList(arr) {
  if (!Array.isArray(arr) || !arr.length) return false;
  return arr.every(
    (m) =>
      m &&
      typeof m.id === "string" &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string"
  );
}

/**
 * @param {import("react").SetStateAction<typeof initialMessage[]>} msgs
 * @param {string} [fallbackTitle="Naya chat"]
 */
function titleFromMessages(msgs, fallbackTitle = "Naya chat") {
  const u = msgs.find((m) => m.role === "user");
  if (!u) return fallbackTitle;
  const line = u.content.replace(/\s+/g, " ").trim();
  if (!line) return fallbackTitle;
  return line.length > 44 ? `${line.slice(0, 44)}…` : line;
}

function newChatObject() {
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    title: "Naya chat",
    updatedAt: Date.now(),
    messages: [initialMessage],
  };
}

/**
 * @returns {{ activeId: string, chats: { id: string, title: string, updatedAt: number, messages: any[] }[] } | null}
 */
function readStoredState() {
  try {
    const v2 = localStorage.getItem(STORAGE_V2);
    if (v2) {
      try {
        const j = JSON.parse(v2);
        if (j && typeof j.activeId === "string" && Array.isArray(j.chats) && j.chats.length) {
          let v2ok = true;
          for (const c of j.chats) {
            if (!c.id || !isValidMessageList(c.messages)) {
              v2ok = false;
              break;
            }
          }
          if (v2ok) {
            return {
              activeId: j.activeId,
              chats: j.chats.map((c) => ({
                id: c.id,
                title: String(c.title || "Chat"),
                updatedAt: Number(c.updatedAt) || Date.now(),
                messages: c.messages,
              })),
            };
          }
        }
      } catch {
        /* bad v2 JSON — try v1 */
      }
    }
    // Migrate v1: single list of messages → one session
    const v1 = localStorage.getItem(STORAGE_V1);
    if (v1) {
      try {
        const p = JSON.parse(v1);
        if (isValidMessageList(p)) {
          const id = `m${Date.now()}`;
          return {
            activeId: id,
            chats: [
              {
                id,
                title: "Purani chat",
                updatedAt: Date.now(),
                messages: p,
              },
            ],
          };
        }
      } catch {
        /* ignore v1 */
      }
    }
  } catch (e) {
    console.warn("[chat] read state", e);
  }
  return null;
}

export default function ChatContainer() {
  const first = useMemo(() => {
    const o = newChatObject();
    return { activeId: o.id, chats: [o] };
  }, []);

  const [activeId, setActiveId] = useState(first.activeId);
  const [chats, setChats] = useState(first.chats);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const endRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) || chats[0] || null,
    [chats, activeId]
  );

  const messages = activeChat ? activeChat.messages : [initialMessage];

  // Hydrate from localStorage
  useEffect(() => {
    const stored = readStoredState();
    if (stored) {
      setChats(stored.chats);
      if (stored.chats.some((c) => c.id === stored.activeId)) {
        setActiveId(stored.activeId);
      } else {
        setActiveId(stored.chats[0].id);
      }
    }
    setStorageReady(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!storageReady) return;
    try {
      const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
      const payload = {
        activeId,
        chats: sorted.map((c) => ({ ...c })),
      };
      localStorage.setItem(STORAGE_V2, JSON.stringify(payload));
    } catch (e) {
      console.warn("[chat] save", e);
    }
  }, [chats, activeId, storageReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messages, isLoading]);

  /** Apply to a specific chat (use request chat id in async fetches to avoid mix-ups) */
  const updateChatById = useCallback((chatId, updateFn) => {
    if (!chatId) return;
    setChats((prev) => {
      const i = prev.findIndex((c) => c.id === chatId);
      if (i < 0) return prev;
      const c = prev[i];
      const nextMessages =
        typeof updateFn === "function" ? updateFn(c.messages) : updateFn;
      if (!isValidMessageList(nextMessages)) return prev;
      const now = Date.now();
      const title = titleFromMessages(nextMessages, c.title);
      const next = { ...c, messages: nextMessages, updatedAt: now, title };
      const out = [...prev];
      out[i] = next;
      return out;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    if (isLoading) return;
    const o = newChatObject();
    setChats((prev) => [o, ...prev]);
    setActiveId(o.id);
    setInput("");
  }, [isLoading]);

  const handleSelectChat = useCallback(
    (id) => {
      if (isLoading) return;
      if (!chats.some((c) => c.id === id)) return;
      setActiveId(id);
      setInput("");
    },
    [chats, isLoading]
  );

  const clearChat = useCallback(() => {
    if (!activeId) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [initialMessage],
              title: "Naya chat",
              updatedAt: Date.now(),
            }
          : c
      )
    );
    setInput("");
  }, [activeId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !activeId) return;
    const requestChatId = activeId;
    const now = Date.now();

    const currentMessages = chats.find((c) => c.id === requestChatId)?.messages;
    if (!currentMessages) return;

    const userMsg = {
      id: `user-${now}`,
      role: "user",
      content: text,
      createdAt: now,
    };

    const historyForApi = [
      ...currentMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    updateChatById(requestChatId, (prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errText =
          typeof data?.error === "string" ? data.error : "Request failed";
        updateChatById(requestChatId, (prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Error: ${errText}`,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      const raw =
        typeof data?.reply === "string"
          ? data.reply
          : typeof data?.message === "string"
            ? data.message
            : "";
      const reply = String(raw);
      if (!reply) {
        updateChatById(requestChatId, (prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "No reply from server.",
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      updateChatById(requestChatId, (prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
        },
      ]);
    } catch {
      updateChatById(requestChatId, (prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network error. Check your connection and try again.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeId, chats, updateChatById]);

  // Sidebar: newest first
  const chatsForSidebar = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-100 md:flex-row">
      <ChatSidebar
        chats={chatsForSidebar}
        activeId={activeId}
        onSelect={handleSelectChat}
        onNewChat={handleNewChat}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isBusy={isLoading}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-white/10 bg-slate-950/40 px-4 py-3.5 sm:px-6 lg:px-10">
          <div className="flex w-full max-w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
                aria-label="Chats ki list"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    ✦
                  </span>
                  <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                    {activeChat?.title || "Smart Chat"}
                  </h1>
                </div>
                <p className="mt-0.5 line-clamp-1 pl-1 text-xs text-slate-500 sm:text-[0.8125rem]">
                  Naya chat banao ya purana kholen — sab browser mein save
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              disabled={isLoading}
              className="shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200/90 transition hover:border-rose-400/50 hover:bg-rose-500/20 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className="w-full max-w-full space-y-1 px-4 py-4 sm:space-y-1.5 sm:px-6 lg:px-10"
            style={{ minHeight: "10rem" }}
          >
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                createdAt={m.createdAt}
              />
            ))}

            {isLoading && (
              <div className="flex w-full max-w-full gap-3 pr-0">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-[0.7rem] font-bold text-cyan-200/90 ring-2 ring-slate-500/30"
                  aria-hidden
                >
                  AI
                </div>
                <div className="flex min-h-12 max-w-full flex-1 items-center gap-1.5 rounded-2xl rounded-bl-md border border-cyan-500/15 bg-slate-800/80 px-4 py-3 shadow-inner">
                  <span
                    className="inline-block h-2 w-2 animate-bounce rounded-full bg-cyan-400/80 [animation-delay:-0.3s]"
                    aria-hidden
                  />
                  <span
                    className="inline-block h-2 w-2 animate-bounce rounded-full bg-cyan-400/80 [animation-delay:-0.15s]"
                    aria-hidden
                  />
                  <span
                    className="inline-block h-2 w-2 animate-bounce rounded-full bg-cyan-400/80"
                    aria-hidden
                  />
                  <span className="ml-1 text-sm text-slate-500">Soch raha hoon…</span>
                  <span className="sr-only">Jawaab a raha hai</span>
                </div>
              </div>
            )}

            <div ref={endRef} className="h-1 shrink-0" />
          </div>
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Jawaab ka intezar…" : "Likh kar bhejain…"}
        />
      </div>
    </div>
  );
}
