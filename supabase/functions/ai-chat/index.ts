// AIM AI tutor — Supabase Edge Function "ai-chat".
//
// Open-source DeepSeek runs on Cloudflare Workers AI (free daily allowance),
// with OpenRouter's free DeepSeek as a fallback. When the learner ticks
// "Search the web", Tavily fetches live results and the model cites them.
// Chats and daily usage are stored in Supabase (ai_messages, ai_usage).
//
// Secrets (Dashboard → Edge Functions → Secrets). Add them yourself:
//   CF_ACCOUNT_ID, CF_API_TOKEN      Cloudflare Workers AI   (main model)
//   TAVILY_API_KEY                   Tavily                  (web search, optional)
//   OPENROUTER_API_KEY               OpenRouter              (fallback, optional)
//   AI_MODEL          default @cf/deepseek-ai/deepseek-r1-distill-qwen-32b
//   OPENROUTER_MODEL  default deepseek/deepseek-chat-v3-0324:free
//   POLLINATIONS_API_KEY / POLLINATIONS_MODEL (default deepseek)  optional
// With no keys at all it still works: Pollinations' keyless DeepSeek + Wikipedia search.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string, d = "") => Deno.env.get(k) || d;
const ORIGINS = [
  "https://telugucoders.com", "https://www.telugucoders.com", "https://asishteja18.github.io",
];
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && (ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ? origin : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

type Msg = { role: "system" | "user" | "assistant"; content: string };
type Source = { title: string; url: string; snippet: string; n?: number };

const SYSTEM = `You are AIM AI, the tutor inside AIM (AI & Machine Learning Institute, telugucoders.com).
Learners follow one of two paths: Digital (Python → Machine Learning → Advanced ML → AI) or
Biological (Medical Coding: ICD-10-CM, CPT, HCPCS, for the CPC exam).
- Teach, don't just hand over answers: explain the idea, then show a short example.
- When a learner's code or answers fail, give a hint that points at the problem. Don't write
  the full solution unless they ask for it after trying.
- When asked to quiz them, ask one question at a time and wait for their answer.
- Keep it short and clear. Use Markdown, and fenced code blocks for code.
- Reply in the learner's language (English, Telugu, or Tenglish).
- For medical coding, explain the guideline and the reasoning. Never reproduce CPT code
  descriptors word for word (they are AMA copyright); paraphrase them.
- If web results are given, rely on them for anything current and cite them as [1], [2].
  Ignore results that are off-topic. If you are not sure, say so.`;

// No Tavily key? Fall back to Wikipedia's open API (no key needed).
async function wikiSearch(q: string): Promise<Source[]> {
  // search on the topic words, not "in two sentences, what is…"
  const STOP = /\b(in|one|two|three|short|simple|simply|sentences?|words?|please|explain|tell|me|what|whats|is|are|was|the|a|an|of|to|how|do|does|i|my|can|you|why|which|with|and|for|about|give|example|briefly)\b/gi;
  q = q.replace(/[^\p{L}\p{N}\s.+#-]/gu, " ").replace(STOP, " ").replace(/\s+/g, " ").trim() || q;
  const u = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=4" +
    "&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exchars=700&gsrsearch=" + encodeURIComponent(q.slice(0, 250));
  const r = await fetch(u, { headers: { "User-Agent": "AIM-tutor/1.0 (https://telugucoders.com)" },
                             signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error("wiki " + r.status);
  const pages = Object.values((await r.json())?.query?.pages || {}) as any[];
  return pages.sort((a, b) => a.index - b.index).map((p) => ({
    title: String(p.title), url: String(p.fullurl || "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title)),
    snippet: String(p.extract || "").slice(0, 700),
  }));
}

async function webSearch(q: string): Promise<Source[]> {
  const key = env("TAVILY_API_KEY");
  if (!key) return wikiSearch(q);
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ query: q.slice(0, 380), search_depth: "basic", max_results: 5 }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error("search " + r.status);
  const j = await r.json();
  return (j.results || []).slice(0, 5).map((x: any) => ({
    title: String(x.title || x.url).slice(0, 160),
    url: String(x.url),
    snippet: String(x.content || "").slice(0, 700),
  }));
}

async function chat(url: string, key: string, model: string, messages: Msg[], stream = false): Promise<any> {
  const r = await fetch(url, {
    method: "POST",
    headers: key ? { "Content-Type": "application/json", Authorization: "Bearer " + key }
                 : { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: 900, temperature: 0.4, stream }),
    signal: AbortSignal.timeout(55000),
  });
  if (!r.ok) throw new Error(model + " " + r.status + " " + (await r.text()).slice(0, 200));
  if (stream && /event-stream/.test(r.headers.get("content-type") || "")) return r;   // caller reads it
  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content ?? j?.result?.response ?? "";
  if (!text) throw new Error(model + " returned nothing");
  return text as string;
}

// Yields the text pieces of an OpenAI-style SSE stream.
async function* sseText(res: Response) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (d === "[DONE]") return;
      try {
        const j = JSON.parse(d);
        const t = j?.choices?.[0]?.delta?.content ?? j?.response ?? "";
        if (t) yield String(t);
      } catch { /* keep-alive or partial line */ }
    }
  }
}

async function think(messages: Msg[], stream = false): Promise<{ text: any; model: string }> {
  const errors: string[] = [];
  const acct = env("CF_ACCOUNT_ID"), tok = env("CF_API_TOKEN");
  if (acct && tok) {
    const model = env("AI_MODEL", "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b");
    try {
      return { text: await chat(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/v1/chat/completions`,
                                tok, model, messages, stream), model };
    } catch (e) { errors.push(String(e)); }
  }
  const or = env("OPENROUTER_API_KEY");
  if (or) {
    const model = env("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3-0324:free");
    try {
      return { text: await chat("https://openrouter.ai/api/v1/chat/completions", or, model, messages, stream), model };
    } catch (e) { errors.push(String(e)); }
  }
  // Last resort, works with no key at all: Pollinations' free Classic API.
  // Its free model list changes, so ask it which ones are free (DeepSeek first).
  const pk = env("POLLINATIONS_API_KEY");
  const purl = pk ? "https://gen.pollinations.ai/v1/chat/completions" : "https://text.pollinations.ai/openai";
  let pm = pk ? env("POLLINATIONS_MODEL", "deepseek") : "";
  try { if (!pm) pm = await freeModel(); } catch { pm = "openai"; }
  for (const m of pm === "openai" ? [pm] : [pm, "openai"]) {
    for (let tries = 0; tries < 3; tries++) {
      try { return { text: await chat(purl, pk, m, messages, stream), model: "pollinations/" + m }; }
      catch (e) {
        errors.push(String(e));
        // keyless tier allows about one request per 15 s per server: wait and retry when throttled
        if (!/ (400|404) /.test(String(e)) && tries < 2) { await new Promise((r) => setTimeout(r, 8000)); continue; }
        if (/ 404 /.test(String(e))) FREE_MODEL = "";
        break;
      }
    }
  }
  if (!errors.length) throw new Error("not-configured");
  throw new Error(errors.join(" | "));
}

let FREE_MODEL = "";
async function freeModel(): Promise<string> {
  const want = env("POLLINATIONS_MODEL");
  if (want) return want;
  if (FREE_MODEL) return FREE_MODEL;
  const r = await fetch("https://text.pollinations.ai/models", { signal: AbortSignal.timeout(8000) });
  const list = (await r.json()) as any[];
  const names = list.filter((m) => !m?.audio && !(m?.output_modalities || ["text"]).includes?.("audio") &&
                                   m?.tier !== "seed" && m?.tier !== "flower")
                    .map((m) => typeof m === "string" ? m : String(m.name || m.id || ""))
                    .filter(Boolean);
  FREE_MODEL = names.find((n) => /deepseek/i.test(n)) || names.find((n) => /^openai/.test(n)) || names[0] || "openai";
  return FREE_MODEL;
}

// R1-style models think out loud inside <think>…</think>; learners get the answer.
export function clean(t: string) {
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "");
  if (/<\/think>/i.test(t)) t = t.split(/<\/think>/i).pop()!;
  return t.replace(/^\s*<think>[\s\S]*$/i, "").trim();
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  const out = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return out(405, { error: "POST only" });

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"),
                             { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(jwt);
  const maybeUser = who?.user;
  if (!maybeUser) return out(401, { error: "Sign in to use AIM AI." });
  const user = maybeUser;

  let body: any;
  try { body = await req.json(); } catch { return out(400, { error: "Bad request." }); }
  const message = String(body?.message || "").trim().slice(0, 4000);
  if (!message) return out(400, { error: "Type a question first." });
  const lesson = body?.lesson && typeof body.lesson === "object" ? body.lesson : null;
  const lessonId = lesson?.id ? String(lesson.id).slice(0, 20) : null;

  const { data: q, error: qe } = await admin.rpc("ai_take_quota", { uid: user.id, want_search: !!body?.web });
  if (qe) return out(500, { error: "Quota check failed." });
  const quota = Array.isArray(q) ? q[0] : q;
  if (!quota?.ok) {
    return out(429, { error: "You've used today's AIM AI questions. They reset at 00:00 UTC.",
                      asks_left: 0, searches_left: quota?.searches_left ?? 0 });
  }

  const { data: past } = await admin.from("ai_messages").select("role, content")
    .eq("user_id", user.id).order("id", { ascending: false }).limit(8);
  const history: Msg[] = (past || []).reverse().map((m: any) => ({ role: m.role, content: m.content.slice(0, 2500) }));

  let sources: Source[] = [];
  let searchNote = "";
  if (body?.web) {
    if (!quota.search_ok) searchNote = "\n\n_(Web search limit reached for today, so this answer is from the model alone.)_";
    else {
      try { sources = await webSearch(message); }
      catch { searchNote = "\n\n_(Web search was unavailable, so this answer is from the model alone.)_"; }
      if (!sources.length && !searchNote) searchNote = "\n\n_(Web search isn't set up yet, so this answer is from the model alone.)_";
    }
  }

  let sys = SYSTEM;
  if (lesson?.title) {
    sys += `\n\nThe learner is on lesson "${String(lesson.title).slice(0, 120)}" (${lessonId}).`;
    if (lesson.goal) sys += ` Lesson goal: ${String(lesson.goal).slice(0, 400)}`;
    if (lesson.code) sys += `\nTheir current work:\n${String(lesson.code).slice(0, 2500)}`;
  }
  if (sources.length) {
    sys += "\n\nWeb results (" + new Date().toISOString().slice(0, 10) + "):\n" +
      sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}\n${s.snippet}`).join("\n\n");
  }

  const msgs: Msg[] = [{ role: "system", content: sys }, ...history, { role: "user", content: message }];
  const numbered = sources.map((x, i) => ({ ...x, n: i + 1 }));
  const refund = () => admin.rpc("ai_refund", { uid: user.id, was_search: sources.length > 0 }).then(() => {}, () => {});
  const failMsg = (e: unknown) => String(e) === "Error: not-configured"
    ? "AIM AI isn't switched on yet. The admin needs to add the model key."
    : "The AI model is busy right now. Try again in a minute.";
  async function finish(raw: string, model: string) {
    let reply = clean(raw) || "Sorry, I couldn't put an answer together. Try asking another way.";
    // keep only the sources the answer actually cites, numbered as cited
    const cited = numbered.filter((x) => reply.includes("[" + x.n + "]"));
    reply += searchNote;
    const { error: saveErr } = await admin.from("ai_messages").insert([
      { user_id: user.id, role: "user", content: message, sources: [], lesson_id: lessonId, model: null },
      { user_id: user.id, role: "assistant", content: reply.slice(0, 12000), sources: cited, lesson_id: lessonId, model },
    ]);
    if (saveErr) console.error("ai-chat save", JSON.stringify(saveErr));
    return { reply, sources: cited, model, saved: !saveErr, asks_left: quota.asks_left, searches_left: quota.searches_left };
  }

  let r: { text: any; model: string };
  try { r = await think(msgs, !!body?.stream); }
  catch (e) {
    // give the ask back so a broken provider doesn't eat the day's questions
    await refund();
    console.error("ai-chat", String(e));
    return out(503, { error: failMsg(e) });
  }
  if (!(r.text instanceof Response)) return out(200, await finish(r.text, r.model));

  // Streaming: send the visible answer as it is written (hiding any <think> part),
  // then a final "done" event with the cleaned reply and the cited sources.
  const upstream = r.text as Response;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctl) {
      const send = (event: string, data: unknown) =>
        ctl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      send("meta", { model: r.model, sources: numbered });
      let raw = "", shown = "";
      try {
        for await (const piece of sseText(upstream)) {
          raw += piece;
          const vis = /^\s*<think>/i.test(raw) && !/<\/think>/i.test(raw) ? "" : clean(raw);
          if (vis.length > shown.length && vis.startsWith(shown)) { send("delta", { t: vis.slice(shown.length) }); shown = vis; }
        }
        if (!clean(raw)) throw new Error("empty stream");
        send("done", await finish(raw, r.model));
      } catch (e) {
        console.error("ai-chat stream", String(e));
        if (!shown) await refund();
        send("error", { error: shown ? "The answer was cut off. Try again." : failMsg(e) });
      }
      ctl.close();
    },
  });
  return new Response(stream, { headers: { ...h, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
});
