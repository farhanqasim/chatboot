import { NextResponse } from "next/server";

// Groq decommissioned llama3-8b-8192; replacement per https://console.groq.com/docs/deprecations
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_TURNS = 32;

const MISSING_KEY_REPLY =
  "Groq API not configured. Please add GROQ_API_KEY in .env.local";

const SYSTEM_INSTRUCTIONS = `You are a smart, friendly assistant the user talks to in this chat app.
- Use the full conversation. Answer in context.
- If the user writes in Urdu or Roman Urdu, reply in that style when appropriate; English is fine when they use English.
- For apps or code, give clear steps and markdown code blocks.`;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * @param {object} body
 * @returns {{ role: "user" | "assistant" | "system", content: string }[] | null}
 */
function getChatMessages(body) {
  if (Array.isArray(body?.messages) && body.messages.length > 0) {
    const list = body.messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length > 0
      )
      .map((m) => ({ role: m.role, content: m.content.trim() }));
    if (list.length === 0 || list[list.length - 1].role !== "user") {
      return null;
    }
    return list.length > MAX_TURNS ? list.slice(-MAX_TURNS) : list;
  }
  if (typeof body?.message === "string" && body.message.trim()) {
    return [{ role: "user", content: body.message.trim() }];
  }
  return null;
}

/** @param {string} key */
function getGroqKeyFromEnv() {
  const a = "GROQ";
  const b = "API";
  const c = "KEY";
  // Avoid bundlers inlining a missing GROQ_API_KEY as undefined at build
  return (process.env[[a, b, c].join("_")] || "").trim();
}

/**
 * @param {number} status
 * @param {string} bodyText
 * @returns {string}
 */
function formatGroqFailureMessage(status, bodyText) {
  let detail = (bodyText || "").slice(0, 500);
  try {
    const j = JSON.parse(bodyText);
    const msg = j?.error?.message;
    if (typeof msg === "string" && msg) detail = msg;
  } catch {
    /* use raw */
  }
  if (!detail) detail = "No details from Groq. Check the terminal for logs.";
  return `Groq API error (HTTP ${status}): ${detail}`;
}

/**
 * POST /api/chat
 * Body: { message: string } OR { messages: [...] }
 * Returns: { reply: string }
 */
export async function POST(request) {
  const rawKey = getGroqKeyFromEnv();
  console.log(
    "[api/chat] GROQ_API_KEY:",
    rawKey
      ? `set (char length ${rawKey.length})`
      : "MISSING — add GROQ_API_KEY in project root .env.local and restart dev"
  );
  if (!rawKey) {
    console.error("[api/chat] Groq: GROQ_API_KEY empty after load");
    return NextResponse.json({ reply: String(MISSING_KEY_REPLY) });
  }

  try {
    const body = await request.json();
    const list = getChatMessages(body);

    if (!list) {
      return NextResponse.json(
        {
          error:
            "Send { message: string } or a valid messages[] ending with a user turn.",
        },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      ...list,
    ];

    let res;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
        }),
      });
    } catch (e) {
      console.error("[api/chat] Groq fetch/network error:", e);
      return NextResponse.json({
        reply: `Could not reach Groq. Check your internet. (${String(e && e.message ? e.message : e)})`,
      });
    }

    const resText = await res.text();

    if (!res.ok) {
      console.error("[api/chat] Groq HTTP", res.status, resText);
      return NextResponse.json({
        reply: String(formatGroqFailureMessage(res.status, resText)),
      });
    }

    let data;
    try {
      data = JSON.parse(resText);
    } catch (e) {
      console.error("[api/chat] Groq response not JSON:", e, resText.slice(0, 200));
      return NextResponse.json({
        reply: "Groq returned a non-JSON body. See server console.",
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    const reply =
      text != null && String(text).trim() !== "" ? String(text).trim() : null;

    if (!reply) {
      console.error("[api/chat] Groq empty content:", resText.slice(0, 500));
      return NextResponse.json({
        reply: "Groq returned an empty message. See server console.",
      });
    }

    return NextResponse.json({ reply: String(reply) });
  } catch (err) {
    console.error("[api/chat] POST /api/chat:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
