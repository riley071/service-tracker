import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { accountConfigured, authenticate, resetPassword } from '../data/account';
import { Badge, Button, colors, Field, ui } from './ui';

export function Login({ onEnter }: { onEnter: () => void }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(reset = false) {
    setBusy(true); setMessage('');
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
      if (reset) { await resetPassword(email); setMessage('If this account exists, a recovery email has been requested. Follow your configured recovery flow.'); return; }
      if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
      if (await authenticate(email, password, signup)) onEnter();
      else setMessage('Check your email to confirm your account, then sign in.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}><View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: 22 }}>
    <Text style={[ui.title, { fontSize: 30 }]}>w. Workfolio</Text><Badge text="MADE FOR YOUR NEXT CHAPTER" />
    <Text style={[ui.title, { fontSize: 38 }]}>{signup ? 'Good work deserves a great start.' : 'Your work.\nAll together.'}</Text>
    <Text style={ui.muted}>Professional quotations, simpler invoices and a clearer view of your business. Built with Malawi’s independent workers in mind.</Text>
    <View style={ui.card}><Text style={ui.title}>{signup ? 'Create your account' : 'Welcome back'}</Text>
      <Field label="Email address" value={email} onChangeText={setEmail} />
      <Text style={ui.label}>Password</Text><TextInput accessibilityLabel="Password" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} style={ui.input} placeholder="At least 8 characters" />
      {!!message && <Text accessibilityRole="alert" style={ui.muted}>{message}</Text>}
      <Button title={busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} disabled={busy || !accountConfigured} onPress={() => void submit()} />
      <Button title={signup ? 'Already registered? Sign in' : 'New here? Create an account'} secondary disabled={busy} onPress={() => { setSignup(!signup); setMessage(''); }} />
      {!signup && <Button title="Forgot password?" secondary disabled={busy || !accountConfigured} onPress={() => void submit(true)} />}
    </View>
    {!accountConfigured && <Text accessibilityRole="alert" style={ui.muted}>Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the app. An account is required to continue.</Text>}
    <Text style={ui.muted}>MWK currency · Phone and desktop · PDF and Excel exports</Text>
  </View></ScrollView>;
}
