import React from "react";
import ChatContainer from "../../components/ChatContainer";

/**
 * /chat — gradient shell + main chat
 */
export default function ChatPage() {
  return (
    <div className="relative flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(1200px 600px at 50% -20%, rgba(109, 40, 217, 0.35) 0%, transparent 50%),
            radial-gradient(900px 500px at 100% 50%, rgba(192, 38, 211, 0.12) 0%, transparent 45%),
            radial-gradient(800px 500px at 0% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 45%),
            linear-gradient(180deg, #0c0a1a 0%, #0a0a0f 40%, #06080d 100%)
          `,
        }}
        aria-hidden
      />
      <div className="box-border flex h-full w-full min-h-0 flex-1 flex-col p-0">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-none border-y border-white/10 bg-slate-950/55 shadow-none ring-0 supports-[backdrop-filter]:backdrop-blur-sm md:border-x md:border-white/10">
          <ChatContainer />
        </div>
      </div>
    </div>
  );
}
