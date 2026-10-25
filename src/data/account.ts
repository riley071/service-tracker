// Tokens remain in memory: shared devices must sign in again after a restart.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const accountConfigured = !!url && !!key;
export type Account = { id: string; email: string; token: string; refresh: string; expires: number };
let account: Account | null = null;
let revision = 0;
export function currentAccount() { return account; }
async function request(path: string, body?: unknown, method = 'POST', token?: string) {
  if (!url || !key) throw new Error('Supabase is not configured. Set the project URL and public key in .env.local, then restart Expo.');
  const response = await fetch(`${url}${path}`, { method, headers: { apikey: key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.msg || result?.message || result?.error_description || 'The request failed. Please try again.');
  return result;
}
export async function authenticate(email: string, password: string, signup: boolean) {
  const result = await request(signup ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password', { email: email.trim(), password });
  if (!result.access_token) return false;
  account = { id: result.user.id, email: result.user.email, token: result.access_token, refresh: result.refresh_token, expires: Date.now() + result.expires_in * 1000 };
  revision = 0;
  return true;
}
async function token() {
  if (!account) throw new Error('Sign in to continue.');
  if (account.expires < Date.now() + 60000) {
    const result = await request('/auth/v1/token?grant_type=refresh_token', { refresh_token: account.refresh });
    account = { ...account, token: result.access_token, refresh: result.refresh_token, expires: Date.now() + result.expires_in * 1000 };
  }
  return account.token;
}
export async function signOut() {
  try { if (account) await request('/auth/v1/logout', {}, 'POST', await token()); }
  finally { account = null; revision = 0; }
}
export async function resetPassword(email: string) { await request('/auth/v1/recover', { email: email.trim() }); }
export async function changePassword(password: string) { await request('/auth/v1/user', { password }, 'PUT', await token()); }
export async function cloudLoad() {
  const rows = await request('/rest/v1/workspaces?select=data,revision', undefined, 'GET', await token());
  revision = rows[0]?.revision ?? 0;
  return rows[0]?.data ?? null;
}
export async function cloudSave(data: unknown) {
  const next = await request('/rest/v1/rpc/save_workspace', { payload: data, expected_revision: revision }, 'POST', await token());
  revision = next;
}
