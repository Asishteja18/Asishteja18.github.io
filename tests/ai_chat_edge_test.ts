// deno run -A tests/ai_chat_edge_test.ts
// Runs the ai-chat function against mocked Supabase, Tavily and Cloudflare.
const realFetch = globalThis.fetch;
const seen: Record<string, any[]> = {};
let modelMode = "ok";
globalThis.fetch = async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("http://localhost:8000")) return realFetch(input, init);
  const body = init?.body ? String(init.body) : (input instanceof Request ? await input.clone().text() : "");
  const key = new URL(url).pathname;
  (seen[key] ||= []).push({ url, body, headers: init?.headers || (input instanceof Request ? Object.fromEntries(input.headers) : {}) });
  const J = (o: any, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
  if (url.includes("/auth/v1/user")) {
    const auth = input instanceof Request ? input.headers.get("authorization") : new Headers(init?.headers).get("authorization");
    return auth === "Bearer good" ? J({ id: "u1", aud: "authenticated", email: "a@b.c" }) : J({ msg: "bad jwt" }, 401);
  }
  if (url.includes("/rpc/ai_take_quota")) return J([{ ok: !body.includes("u-empty"), search_ok: true, asks_left: 19, searches_left: 4 }]);
  if (url.includes("/rpc/ai_refund")) return J(null);
  if (url.includes("/rest/v1/ai_messages")) return init?.method === "POST" || (input instanceof Request && input.method === "POST") ? new Response(null, { status: 201 }) : J([{ role: "assistant", content: "earlier" }]);
  if (url.includes("api.tavily.com")) return J({ results: [{ title: "Docs", url: "https://docs.python.org/x", content: "lists are mutable" }] });
  if (url.includes("api.cloudflare.com")) {
    if (modelMode === "fail") return J({ errors: ["x"] }, 500);
    return J({ choices: [{ message: { content: "<think>hmm let me see</think>\nLists are mutable [1]." } }] });
  }
  if (url.includes("openrouter.ai")) return J({ choices: [{ message: { content: "fallback answer" } }] });
  return J({ unexpected: url }, 599);
};
Deno.env.set("SUPABASE_URL", "http://mock.supabase");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "svc");
Deno.env.set("CF_ACCOUNT_ID", "acct");
Deno.env.set("CF_API_TOKEN", "tok");
Deno.env.set("TAVILY_API_KEY", "tv");
await import(new URL("../supabase/functions/ai-chat/index.ts", import.meta.url).href);
await new Promise((r) => setTimeout(r, 300));
let fails = 0;
const check = (c: boolean, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const call = (jwt: string, body: any, origin = "https://telugucoders.com") => realFetch("http://localhost:8000", {
  method: "POST", headers: { authorization: "Bearer " + jwt, "content-type": "application/json", origin }, body: JSON.stringify(body) });

let r = await realFetch("http://localhost:8000", { method: "OPTIONS", headers: { origin: "http://localhost:8765" } });
check(r.headers.get("access-control-allow-origin") === "http://localhost:8765", "CORS preflight allows localhost");
await r.text();
r = await call("bad", { message: "hi" });
check(r.status === 401, "rejects a bad token (" + r.status + ")"); await r.text();
r = await call("good", { message: "" });
check(r.status === 400, "rejects an empty question"); await r.text();
r = await call("good", { message: "are lists mutable?", web: true, lesson: { id: "py-03", title: "Lists", code: "a=[1]" } });
let j = await r.json();
check(r.status === 200, "answers (" + r.status + " " + JSON.stringify(j).slice(0, 120) + ")");
check(j.reply === "Lists are mutable [1].", "strips the <think> block: " + JSON.stringify(j.reply));
check(j.sources?.length === 1 && j.sources[0].url === "https://docs.python.org/x", "returns web sources");
check(j.model === "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", "uses DeepSeek on Cloudflare by default");
const cf = JSON.parse(seen["/client/v4/accounts/acct/ai/v1/chat/completions"].at(-1).body);
check(cf.messages[0].content.includes("[1] Docs") && cf.messages[0].content.includes('lesson "Lists"'), "prompt has web results and lesson");
check(cf.messages.some((m: any) => m.content === "earlier"), "prompt has chat history");
const ins = seen["/rest/v1/ai_messages"].filter((x) => x.body);
check(ins.length === 1 && JSON.parse(ins[0].body).length === 2, "saves question + answer to Supabase");
modelMode = "fail";
Deno.env.set("OPENROUTER_API_KEY", "or");
r = await call("good", { message: "x" }); j = await r.json();
check(r.status === 200 && j.reply === "fallback answer" && j.model.endsWith(":free"), "falls back to OpenRouter free DeepSeek");
Deno.env.delete("OPENROUTER_API_KEY");
r = await call("good", { message: "x" }); j = await r.json();
check(r.status === 503 && !!seen["/rest/v1/rpc/ai_refund"], "503 + refund when every model fails");
Deno.env.delete("CF_ACCOUNT_ID");
r = await call("good", { message: "x" }); j = await r.json();
check(r.status === 503 && j.error.includes("isn't switched on"), "clear message when no model key is set");
console.log(fails + " failure(s)");
Deno.exit(fails ? 1 : 0);
