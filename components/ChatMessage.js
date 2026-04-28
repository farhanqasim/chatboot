import React from "react";

/**
 * Format epoch ms to short time (user locale)
 */
function formatTime(ts) {
  if (ts == null || Number.isNaN(ts)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return null;
  }
}

/**
 * Split on ``` so code from the model (markdown) is readable in a dark code box.
 */
function AssistantContent({ content }) {
  const parts = String(content).split("```");

  if (parts.length < 2) {
    return (
      <p className="whitespace-pre-wrap break-words text-[0.925rem] leading-relaxed text-slate-200">
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {parts.map((chunk, i) => {
        if (i % 2 === 0) {
          if (!chunk.trim()) return null;
          return (
            <p
              key={`t-${i}`}
              className="whitespace-pre-wrap break-words text-[0.925rem] leading-relaxed text-slate-200"
            >
              {chunk}
            </p>
          );
        }
        const firstNl = chunk.indexOf("\n");
        let code = chunk;
        let label = "";
        if (firstNl > -1) {
          const maybe = chunk.slice(0, firstNl).trim();
          if (maybe && /^[a-zA-Z0-9_+#-]{1,24}$/.test(maybe)) {
            label = maybe;
            code = chunk.slice(firstNl + 1);
          }
        }
        return (
          <pre
            key={`c-${i}`}
            className="max-w-full overflow-x-auto rounded-xl border border-cyan-500/20 bg-[#0d1117] p-3.5 text-[0.8125rem] leading-snug text-emerald-100/95 shadow-inner"
          >
            {label ? (
              <span className="mb-2 block text-[0.65rem] font-medium uppercase tracking-wider text-cyan-500/80">
                {label}
              </span>
            ) : null}
            <code className="font-mono text-[0.8rem]">{code.trim()}</code>
          </pre>
        );
      })}
    </div>
  );
}

/**
 * Single turn: avatars, bubbles, optional time. User right, assistant left.
 */
export default function ChatMessage({ role, content, createdAt }) {
  const isUser = role === "user";
  const t = formatTime(createdAt);

  return (
    <div
      className={["flex w-full", isUser ? "justify-end" : "justify-start"].join(" ")}
    >
      <div
        className={[
          "flex max-w-full min-w-0 gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        ].join(" ")}
      >
        {/* Avatar */}
        <div
          className={[
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-lg ring-2",
            isUser
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white ring-violet-500/30"
              : "bg-gradient-to-br from-slate-600 to-slate-800 text-cyan-200 ring-slate-500/30",
          ].join(" ")}
          aria-hidden
        >
          {isUser ? "A" : "AI"}
        </div>

        <div className="min-w-0 max-w-[min(100%,64rem)] flex-1">
        <div
          className={[
            "relative rounded-[1.15rem] px-4 py-2.5 text-sm shadow-md transition-shadow",
            isUser
              ? "bg-gradient-to-br from-violet-600 via-violet-600 to-fuchsia-700 text-white [box-shadow:0_8px_32px_rgba(139,92,246,0.25)]"
              : "border border-white/10 bg-slate-800/90 text-slate-100 [box-shadow:0_8px_32px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:backdrop-blur-sm",
            isUser ? "rounded-br-md" : "rounded-bl-md",
          ].join(" ")}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words [text-shadow:0_1px_0_rgba(0,0,0,0.15)]">
              {content}
            </p>
          ) : (
            <AssistantContent content={content} />
          )}
        </div>
        {t ? (
          <p
            className={[
              "mt-1 px-1 text-[0.7rem] tabular-nums text-slate-500/70",
              isUser ? "text-right" : "text-left",
            ].join(" ")}
          >
            {t}
          </p>
        ) : null}
        </div>
      </div>
    </div>
  );
}
