import { json, bad, requireAuth, upsertUser } from "./_utils.js";

export async function onRequestPost(context){
  const { request, env } = context;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.resp;
  const me = await upsertUser(env.DB, auth.info);

  let body;
  try { body = await request.json(); } catch { return bad("Expected JSON body"); }

  const email = (body?.email || "").trim().toLowerCase();
  const can_write = body?.can_write ? 1 : 0;
  if (!email) return bad("Missing email");

  const other = await env.DB.prepare("SELECT sub, email, name, picture FROM users WHERE lower(email)=?").bind(email).first();
  if (!other) return bad("User not found yet. Ask them to sign in once first.", 404);
  if (other.sub === me.sub) return bad("Cannot share with yourself");

  await env.DB.prepare(
    "INSERT INTO shares (owner_sub, viewer_sub, can_write) VALUES (?, ?, ?) " +
    "ON CONFLICT(owner_sub, viewer_sub) DO UPDATE SET can_write=excluded.can_write"
  ).bind(me.sub, other.sub, can_write).run();

  return json({ ok:true, shared_with: { sub: other.sub, email: other.email, name: other.name, picture: other.picture }, can_write });
}

export async function onRequestDelete(context){
  const { request, env } = context;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.resp;
  const me = await upsertUser(env.DB, auth.info);

  const url = new URL(request.url);
  const viewer_sub = url.searchParams.get("viewer_sub");
  if (!viewer_sub) return bad("viewer_sub required");

  await env.DB.prepare("DELETE FROM shares WHERE owner_sub=? AND viewer_sub=?").bind(me.sub, viewer_sub).run();
  return json({ ok:true });
}
