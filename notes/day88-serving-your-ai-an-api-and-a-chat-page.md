# Day 88 — Serving your AI: an API and a chat page

> **AI-90** · Block 3 · Build an AI from scratch · Day 88 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 88`)

[← Day 87](day87-tool-use-let-the-ai-run-your-automations.md) · [All 90 days](README.md) · [Day 89 →](day89-evaluation-and-the-model-card.md)

---

**Dataset:** your chat model (Day 85) · **Time:** ~2.5 h
**Progress:** `[████████████████████████████░░] 28/30` · **System after today:** open a browser, type a message, **your** model replies.

#### Visual

```text
 browser ──GET /──────────▶ server ──▶ chat page (HTML + JS)
 browser ──POST /chat {"message": "hi"}──▶ handle() ──▶ generate_fn(message) ──▶ {"reply": "..."}
 status codes:  200 ok · 400 bad JSON / missing message · 404 unknown path · 413 message too long
```

#### Notes

- Keep request handling a **pure function** `handle(method, path, body, generate_fn)` → `(status, content_type, body)`. Test it without a network; the server is a thin wrapper.
- Validate everything from the outside world: JSON, required fields, sizes.
- Standard library `http.server` is enough for a demo. For production: FastAPI + uvicorn (Day 56), behind HTTPS.
- Generation is slow on CPU — cap `max_tokens`.

#### Your task — `day88.py`

- `CHAT_PAGE` — a minimal HTML chat page that POSTs to `/chat`.
- `handle(method, path, body, generate_fn, max_len=2000)` as above; `generate_fn(message, max_tokens)` returns the reply (default `max_tokens=100`, capped at 300).
- `serve(generate_fn, port=8000)` — `http.server` wrapper (not tested).

#### Tests

```python
# file: test_day88.py
import json

import day88 as ex


def echo(message, max_tokens):
    return f"echo:{message}:{max_tokens}"


def test_page():
    status, ctype, body = ex.handle("GET", "/", b"", echo)
    assert status == 200 and ctype.startswith("text/html") and b"/chat" in body


def test_chat():
    status, ctype, body = ex.handle("POST", "/chat", json.dumps({"message": "hi", "max_tokens": 999}).encode(), echo)
    assert status == 200 and ctype == "application/json"
    assert json.loads(body) == {"reply": "echo:hi:300"}
    assert json.loads(ex.handle("POST", "/chat", b'{"message": "x"}', echo)[2])["reply"] == "echo:x:100"


def test_errors():
    assert ex.handle("POST", "/chat", b"not json", echo)[0] == 400
    assert ex.handle("POST", "/chat", b'{"msg": "x"}', echo)[0] == 400
    assert ex.handle("POST", "/chat", json.dumps({"message": "x" * 3000}).encode(), echo)[0] == 413
    assert ex.handle("GET", "/nope", b"", echo)[0] == 404
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day88.py
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

CHAT_PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>My AI</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;max-width:640px;margin:2rem auto;padding:0 1rem}
#log div{margin:.4rem 0;padding:.5rem .7rem;border-radius:10px}.u{background:#e8eefc}.a{background:#f2f2f2}
form{display:flex;gap:.5rem}input{flex:1;padding:.6rem}</style></head><body>
<h1>My AI (built from scratch)</h1><div id="log"></div>
<form id="f"><input id="m" autocomplete="off" placeholder="Say something"><button>Send</button></form>
<script>
const log=document.getElementById('log'),f=document.getElementById('f'),m=document.getElementById('m');
function add(cls,t){const d=document.createElement('div');d.className=cls;d.textContent=t;log.appendChild(d);}
f.onsubmit=async e=>{e.preventDefault();const t=m.value.trim();if(!t)return;add('u',t);m.value='';
 const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});
 const j=await r.json();add('a',j.reply||j.error);};
</script></body></html>"""


def _json(status, obj):
    return status, "application/json", json.dumps(obj).encode()


def handle(method, path, body, generate_fn, max_len=2000):
    if method == "GET" and path == "/":
        return 200, "text/html; charset=utf-8", CHAT_PAGE.encode()
    if method == "POST" and path == "/chat":
        try:
            req = json.loads(body or b"{}")
            message = req["message"]
        except (json.JSONDecodeError, KeyError, TypeError):
            return _json(400, {"error": "send JSON like {\"message\": \"hi\"}"})
        if not isinstance(message, str) or not message.strip():
            return _json(400, {"error": "message must be a non-empty string"})
        if len(message) > max_len:
            return _json(413, {"error": f"message longer than {max_len} characters"})
        max_tokens = min(int(req.get("max_tokens", 100)), 300)
        return _json(200, {"reply": generate_fn(message, max_tokens)})
    return _json(404, {"error": "not found"})


def serve(generate_fn, port=8000):
    class H(BaseHTTPRequestHandler):
        def _respond(self, method):
            n = int(self.headers.get("Content-Length", 0))
            status, ctype, out = handle(method, self.path, self.rfile.read(n), generate_fn)
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)

        def do_GET(self):
            self._respond("GET")

        def do_POST(self):
            self._respond("POST")

    print(f"open http://localhost:{port}")
    HTTPServer(("127.0.0.1", port), H).serve_forever()


if __name__ == "__main__":
    serve(lambda msg, n: f"(demo) you said: {msg}")
```

</details>

**Done when:** green + `python day88.py`, open `http://localhost:8000`, then swap the demo lambda for your Day 85 `chat_reply`.

---

[← Day 87](day87-tool-use-let-the-ai-run-your-automations.md) · [All 90 days](README.md) · [Day 89 →](day89-evaluation-and-the-model-card.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
