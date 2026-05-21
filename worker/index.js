// Product Roadmap Sync Worker
// 路由:
//   GET  /api/roadmap          -> 返回最新 rows JSON (任何人可读)
//   PUT  /api/roadmap          -> 写入 rows JSON (需要 Authorization: Bearer <ADMIN_PASSWORD>)
//   GET  /api/roadmap/history  -> 列出历史版本时间戳
//   GET  /api/roadmap/v/:ts    -> 读取某个历史版本
//
// 环境变量 (wrangler secret put):
//   ADMIN_PASSWORD  - 与前端 admin 登录密码一致
//
// KV namespace binding: ROADMAP

const ALLOWED_ORIGINS = [
  "https://mzy1225.github.io",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5500",
  "null", // file:// 协议
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // GET /api/roadmap - 读最新
  if (url.pathname === "/api/roadmap" && request.method === "GET") {
    const data = await env.ROADMAP.get("current");
    if (!data) {
      return json({ rows: null, savedAt: null }, 200, origin);
    }
    const meta = await env.ROADMAP.get("current:meta");
    let savedAt = null;
    try { savedAt = meta ? JSON.parse(meta).savedAt : null; } catch {}
    return new Response(
      JSON.stringify({ rows: JSON.parse(data), savedAt }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) } }
    );
  }

  // PUT /api/roadmap - admin 写
  if (url.pathname === "/api/roadmap" && request.method === "PUT") {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!env.ADMIN_PASSWORD) {
      return json({ error: "Server missing ADMIN_PASSWORD secret" }, 500, origin);
    }
    if (token !== env.ADMIN_PASSWORD) {
      return json({ error: "Unauthorized" }, 401, origin);
    }
    let body;
    try {
      body = await request.text();
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed)) throw new Error("Body must be a JSON array of rows");
    } catch (e) {
      return json({ error: "Invalid JSON: " + e.message }, 400, origin);
    }
    const ts = new Date().toISOString();
    const meta = JSON.stringify({ savedAt: ts });
    // 历史保留 90 天
    await Promise.all([
      env.ROADMAP.put("current", body),
      env.ROADMAP.put("current:meta", meta),
      env.ROADMAP.put("v:" + ts, body, { expirationTtl: 60 * 60 * 24 * 90 }),
    ]);
    return json({ ok: true, savedAt: ts }, 200, origin);
  }

  // GET /api/roadmap/history - 列历史
  if (url.pathname === "/api/roadmap/history" && request.method === "GET") {
    const list = await env.ROADMAP.list({ prefix: "v:", limit: 100 });
    const versions = list.keys.map(k => k.name.slice(2)).sort().reverse();
    return json({ versions }, 200, origin);
  }

  // GET /api/roadmap/v/<ts> - 读历史版本
  const histMatch = url.pathname.match(/^\/api\/roadmap\/v\/(.+)$/);
  if (histMatch && request.method === "GET") {
    const ts = decodeURIComponent(histMatch[1]);
    const data = await env.ROADMAP.get("v:" + ts);
    if (!data) return json({ error: "Version not found" }, 404, origin);
    return new Response(
      JSON.stringify({ rows: JSON.parse(data), savedAt: ts }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) } }
    );
  }

  return json({ error: "Not Found", path: url.pathname }, 404, origin);
}

export default {
  fetch: handle,
};
