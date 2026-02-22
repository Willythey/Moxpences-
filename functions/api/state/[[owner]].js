import { json, bad, requireAuth, upsertUser } from "./_utils.js";

async function canRead(db, ownerSub, viewerSub){
  if (ownerSub === viewerSub) return true;
  const r = await db.prepare("SELECT 1 FROM shares WHERE owner_sub = ? AND viewer_sub = ?").bind(ownerSub, viewerSub).first();
  return !!r;
}

async function canWrite(db, ownerSub, viewerSub){
  if (ownerSub === viewerSub) return true;
  const r = await db.prepare("SELECT can_write FROM shares WHERE owner_sub = ? AND viewer_sub = ?").bind(ownerSub, viewerSub).first();
  return !!r && Number(r.can_write) === 1;
}

export async function onRequestGet(context){
  const { request, env, params } = context;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.resp;
  const me = await upsertUser(env.DB, auth.info);

  const owner = params?.owner || me.sub;
  if (!(await canRead(env.DB, owner, me.sub))) return bad("Not allowed", 403);

  const row = await env.DB.prepare("SELECT owner_sub, state_json, updated_at FROM states WHERE owner_sub = ?").bind(owner).first();
  if (!row) return json({ ok:true, owner_sub: owner, state_json: null, updated_at: null });

  return json({ ok:true, owner_sub: row.owner_sub, state_json: row.state_json, updated_at: row.updated_at });
}

export async function onRequestPut(context){
  const { request, env, params } = context;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.resp;
  const me = await upsertUser(env.DB, auth.info);

  const owner = params?.owner || me.sub;
  if (!(await canWrite(env.DB, owner, me.sub))) return bad("Not allowed", 403);

  let body;
  try { body = await request.json(); } catch { return bad("Expected JSON body"); }
  const state_json = body?.state_json;
  if (typeof state_json !== "string" || state_json.length < 2) return bad("state_json must be a JSON string");

  await env.DB.prepare(
    "INSERT INTO states (owner_sub, state_json, updated_at) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(owner_sub) DO UPDATE SET state_json=excluded.state_json, updated_at=datetime('now')"
  ).bind(owner, state_json).run();

  return json({ ok:true, owner_sub: owner });
}
