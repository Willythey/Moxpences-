import { json, requireAuth, upsertUser } from "./_utils.js";

export async function onRequest(context){
  const { request, env } = context;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.resp;

  const user = await upsertUser(env.DB, auth.info);

  // list who I can view + who can view me
  const canView = await env.DB.prepare(
    "SELECT s.owner_sub, u.email, u.name, u.picture, s.can_write " +
    "FROM shares s JOIN users u ON u.sub = s.owner_sub WHERE s.viewer_sub = ?"
  ).bind(user.sub).all();

  const viewers = await env.DB.prepare(
    "SELECT s.viewer_sub, u.email, u.name, u.picture, s.can_write " +
    "FROM shares s JOIN users u ON u.sub = s.viewer_sub WHERE s.owner_sub = ?"
  ).bind(user.sub).all();

  return json({ ok:true, user, canView: canView.results || [], viewers: viewers.results || [] });
}
