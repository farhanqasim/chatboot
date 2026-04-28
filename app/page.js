import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-slate-100">
      <p className="text-slate-400">Next.js app</p>
      <Link
        href="/chat"
        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
      >
        Open chat
      </Link>
    </div>
  );
}
