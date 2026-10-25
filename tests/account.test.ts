import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Supabase-only auth and persistence contracts', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://unit-test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key';
  const replies: { status: number; body: unknown }[] = [];
  const calls: { path: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ path: String(input), init });
    const reply = replies.shift();
    assert.ok(reply, 'Unexpected network request');
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  }) as typeof fetch;
  try {
    const api = await import('../src/data/account.ts');
    await assert.rejects(api.cloudLoad(), /Sign in/);
    await assert.rejects(api.cloudSave({}), /Sign in/);
    assert.equal(calls.length, 0, 'Unauthenticated operations must not contact storage');
    replies.push({ status: 200, body: { user: { id: 'owner-a' } } });
    assert.equal(await api.authenticate('a@example.com', 'password123', true), false);
    assert.equal(api.currentAccount(), null, 'Confirmation-required signup must not enter the app');
    replies.push({ status: 400, body: { error_description: 'Invalid login credentials' } });
    await assert.rejects(api.authenticate('a@example.com', 'wrongpass', false), /Invalid login/);
    assert.equal(api.currentAccount(), null);
    replies.push({ status: 200, body: { user: { id: 'owner-a', email: 'a@example.com' }, access_token: 'access-a', refresh_token: 'refresh-a', expires_in: 3600 } });
    assert.equal(await api.authenticate(' a@example.com ', 'password123', false), true);
    assert.equal(JSON.parse(String(calls.at(-1)?.init?.body)).email, 'a@example.com');
    const workspace = { version: 1, customers: [], quotes: [], jobs: [] };
    replies.push({ status: 200, body: [{ revision: 7, data: workspace }] });
    assert.deepEqual(await api.cloudLoad(), workspace);
    assert.equal((calls.at(-1)?.init?.headers as Record<string, string>).Authorization, 'Bearer access-a');
    replies.push({ status: 409, body: { message: 'Workspace changed on another device' } });
    await assert.rejects(api.cloudSave(workspace), /Workspace changed/);
    replies.push({ status: 200, body: 8 });
    await api.cloudSave(workspace);
    assert.deepEqual(JSON.parse(String(calls.at(-1)?.init?.body)), { payload: workspace, expected_revision: 7 });
    replies.push({ status: 200, body: 9 });
    await api.cloudSave(workspace);
    assert.equal(JSON.parse(String(calls.at(-1)?.init?.body)).expected_revision, 8);
    replies.push({ status: 200, body: false });
    assert.equal(await api.loadTemplateAccess(), false);
    replies.push({ status: 200, body: [] });
    await assert.rejects(api.loadPaidTemplateStyle('executive'), /payment-verified/);
    replies.push({ status: 200, body: [{ css: 'h1{color:navy}' }] });
    assert.equal(await api.loadPaidTemplateStyle('executive'), 'h1{color:navy}');
    assert.ok(calls.at(-1)?.path.includes('id=eq.executive'));
    assert.equal((calls.at(-1)?.init?.headers as Record<string, string>).Authorization, 'Bearer access-a');
    replies.push({ status: 500, body: { message: 'Temporary sign-out error' } });
    await assert.rejects(api.signOut(), /Temporary/);
    assert.equal(api.currentAccount(), null, 'Sign out must clear local access even when remote revocation fails');
    await assert.rejects(api.cloudLoad(), /Sign in/);
    assert.equal(replies.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL; else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  }
});
