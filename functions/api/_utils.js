function json(data, status=200, headers={}){
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type":"application/json; charset=utf-8", ...headers }
  });
}
function bad(msg, status=400){ return json({ok:false, error: msg}, status); }

async function verifyGoogleIdToken(idToken){
  // Lightweight verification by hitting Google's tokeninfo endpoint.
  // For production-scale, you'd verify signature against Google certs.
  const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
  const res = await fetch(url, { headers: { "accept":"application/json" }});
  if (!res.ok) return null;
  const data = await res.json();
  // Expected fields: sub, email, name, picture, aud, exp, etc.
  return data;
}

function getBearer(request){
  const h = request.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function requireAuth(request){
  const token = getBearer(request);
  if (!token) return { ok:false, resp: bad("Missing Authorization: Bearer <id_token>", 401) };
  const info = await verifyGoogleIdToken(token);
  if (!info || !info.sub) return { ok:false, resp: bad("Invalid Google token", 401) };
  return { ok:true, token, info };
}

async function upsertUser(db, info){
  const sub = info.sub;
  const email = info.email || null;
  const name = info.name || null;
  const picture = info.picture || null;

  await db.prepare(
    "INSERT INTO users (sub, email, name, picture) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(sub) DO UPDATE SET email=excluded.email, name=excluded.name, picture=excluded.picture"
  ).bind(sub, email, name, picture).run();

  return { sub, email, name, picture };
}

export { json, bad, requireAuth, upsertUser };
