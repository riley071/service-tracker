import React, { useState } from 'react';
import { Text, TextInput, View, Switch } from 'react-native';
import { AppData } from '../domain/model';
import { money } from '../domain/money';
import { invoiceBalance } from '../domain/payments';
import { changePassword, currentAccount } from '../data/account';
import { exportExcel } from '../data/excel';
import { Badge, Button, Chips, Field, ui } from './ui';

export function AccountPages({ page, data, commit, logout }: { page: string; data: AppData; commit: (d: AppData) => Promise<void>; logout: () => void }) {
  const [annual, setAnnual] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [prefs, setPrefs] = useState(data.preferences ?? { paymentMethod: 'Airtel Money', paymentPhone: '', dueDays: '14', compact: false });
  async function run(action: () => Promise<void>, success: string) {
    if (busy) return; setBusy(true); setMessage('');
    try { await action(); setMessage(success); } catch (e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  }
  const invoices = data.invoices ?? [];
  const totals = invoices.reduce((s, i) => { const b = invoiceBalance(data, i); return { billed: s.billed + b.total, paid: s.paid + b.paid, due: s.due + b.due }; }, { billed: 0n, paid: 0n, due: 0n });
  return <View style={{ gap: 20 }}>
    {!!message && <Text accessibilityRole="alert" style={ui.muted}>{message}</Text>}
    {page === 'Plans' && <>
      <Badge text="ROOM TO GROW" /><Text style={[ui.title, { fontSize: 32 }]}>A small price for less paperwork.</Text><Text style={ui.muted}>Proposed plans for independent workers and growing businesses. Your records and basic exports remain accessible on every plan.</Text>
      <Chips items={['Monthly', 'Annually · save 2 months']} value={annual ? 'Annually · save 2 months' : 'Monthly'} onChange={v => setAnnual(v !== 'Monthly')} />
      <View style={[ui.row, { alignItems: 'stretch' }]}>{[
        { name: 'Free', price: 0, features: ['10 documents each month', 'Customers and job tracking', 'PDF and Excel exports'] },
        { name: 'Starter', price: 2000, features: ['Proposed: 50 documents each month', 'Proposed: reusable service catalogue', 'Proposed: custom document branding'] },
        { name: 'Pro', price: 5000, features: ['Proposed: unlimited documents', 'Proposed: recurring invoice drafts', 'Proposed: advanced reports and priority support'] },
      ].map(p => <View key={p.name} style={[ui.card, { flex: 1, minWidth: 240, borderColor: p.name === 'Pro' ? '#176348' : '#DDE5DE' }]}><Badge text={p.name === 'Pro' ? 'FOR GROWING BUSINESSES' : p.name.toUpperCase()} /><Text style={ui.title}>{p.name}</Text><Text style={[ui.title, { fontSize: 30 }]}>{money(BigInt(p.price * (annual ? 10 : 1)) * 100n)}</Text><Text style={ui.muted}>{annual ? 'per year · billed annually' : 'per month'}</Text>{p.features.map(f => <Text key={f} style={ui.muted}>✓ {f}</Text>)}<Button title={p.price ? `Register interest in ${p.name}` : 'Current free access'} disabled={busy || !p.price} onPress={() => void run(() => commit({ ...data, planRequest: { plan: p.name, annual, requestedAt: new Date().toISOString() } }), 'Plan interest saved. No charge was made and no paid features were activated.')} /></View>)}</View>
      <Text style={ui.muted}>Paid subscriptions are not live yet. Prices and limits are proposals; all currently available features remain available during this preview. Airtel Money and TNM Mpamba collection will require a connected payment provider.</Text>
      {data.planRequest && <Text style={ui.label}>Your interest: {data.planRequest.plan} · {data.planRequest.annual ? 'annual' : 'monthly'}</Text>}
    </>}
    {page === 'Settings' && <View style={ui.card}><Text style={ui.title}>Make it work your way</Text><Text style={ui.muted}>Currency: Malawian kwacha (MWK) · Timezone: Africa/Blantyre</Text><Field label="Default payment term (days)" value={prefs.dueDays} onChangeText={dueDays => setPrefs({ ...prefs, dueDays })} numeric /><Text style={ui.label}>Preferred payment method</Text><Chips items={['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash']} value={prefs.paymentMethod} onChange={paymentMethod => setPrefs({ ...prefs, paymentMethod })} /><Field label="Payment phone / account details" value={prefs.paymentPhone} onChangeText={paymentPhone => setPrefs({ ...prefs, paymentPhone })} /><View style={ui.row}><Switch accessibilityLabel="Compact lists" value={prefs.compact} onValueChange={compact => setPrefs({ ...prefs, compact })} /><Text style={ui.label}>Compact list spacing</Text></View><Button title="Save preferences" disabled={busy} onPress={() => void run(async () => { if (!/^\d{1,3}$/.test(prefs.dueDays) || Number(prefs.dueDays) < 1) throw new Error('Enter payment terms from 1 to 999 days.'); await commit({ ...data, preferences: prefs }); }, 'Preferences saved.')} /><Text style={ui.muted}>Tax is off. These documents are not MRA-certified electronic tax invoices.</Text></View>}
    {page === 'Profile' && <View style={ui.card}><Badge text="SIGNED IN" /><Text style={ui.title}>{data.business?.owner || 'Your profile'}</Text><Text style={ui.muted}>{currentAccount()?.email || ''}</Text><Text style={ui.muted}>{data.business?.name || 'Use Business profile to add your trading name, logo and contact details.'}</Text>{currentAccount() && <><Text style={ui.label}>New password</Text><TextInput accessibilityLabel="New password" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} style={ui.input} /><Button title="Update password" disabled={busy} onPress={() => void run(async () => { if (password.length < 8) throw new Error('Use at least 8 characters.'); await changePassword(password); setPassword(''); }, 'Password updated.')} /></>}<Button title="Sign out" secondary disabled={busy} onPress={logout} /><Text style={ui.muted}>Sessions end when the app restarts. Passwords and access tokens are never written to local workspace storage.</Text></View>}
    {page === 'Reports' && <><Text style={ui.title}>Know where your money stands.</Text><View style={ui.row}>{[['Invoiced', totals.billed], ['Recorded collections', totals.paid], ['Outstanding', totals.due]].map(([label, value]) => <View key={String(label)} style={[ui.card, { flex: 1, minWidth: 220 }]}><Text style={ui.muted}>{String(label)}</Text><Text style={ui.title}>{money(value as bigint)}</Text></View>)}</View><Text style={ui.muted}>Based on saved invoices and manually recorded payments. This is not a profit or tax report.</Text><Button title="Download Excel workbook" disabled={busy} onPress={() => void run(() => exportExcel(data), 'Excel export prepared.')} /><Text style={ui.title}>Outstanding invoices</Text>{invoices.filter(i => invoiceBalance(data, i).due > 0n).map(i => <View key={i.id} style={ui.card}><Text style={ui.label}>{i.number} · {i.customer.name}</Text><Text style={ui.muted}>Due {i.due} · {money(invoiceBalance(data, i).due)}</Text></View>)}{!invoices.length && <Text style={ui.muted}>Create your first invoice to see your balances here.</Text>}</>}
  </View>;
}
