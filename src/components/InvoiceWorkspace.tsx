import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { AppData, Invoice, Quote } from '../domain/model';
import { documentHtml, issueInvoice } from '../domain/documents';
import { money, quoteTotals } from '../domain/money';
import { exportDocument } from '../data/exportDocument';
import { Badge, Button, Field, ui } from './ui';
import { Editor } from './Editor';

export function InvoiceWorkspace({ data, commit, onClose }: { data: AppData; commit: (d: AppData) => Promise<void>; onClose: () => void }) {
  const [creating, setCreating] = useState(false);
  const [due, setDue] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const invoices = data.invoices ?? [];
  async function create(q: Quote) {
    if (busy) return;
    setError(''); setBusy(true);
    try {
      if (!data.business) throw new Error('Save your business profile first.');
      const customer = data.customers.find(c => c.id === q.customerId);
      if (!customer) throw new Error('Select an existing customer.');
      if (invoices.some(i => i.quoteId === q.id)) throw new Error('This quotation already has an invoice.');
      const invoice = issueInvoice(q, data.business, customer, invoices, due);
      await commit({ ...data, invoices: [invoice, ...invoices] });
      setCreating(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create invoice.'); throw e; }
    finally { setBusy(false); }
  }
  async function pdf(i: Invoice) {
    setBusy(true); setError('');
    try { await exportDocument(documentHtml(i, 'Invoice')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not export invoice.'); }
    finally { setBusy(false); }
  }
  if (creating) return <View style={{ flex: 1 }}><Field label="Payment due (YYYY-MM-DD)" value={due} onChangeText={setDue} /><Editor kind="quote" data={data} onSave={value => create(value as Quote)} onCancel={() => setCreating(false)} documentKind="invoice" /></View>;
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
    <Text style={ui.title}>Invoices</Text><Text style={ui.muted}>Issue invoices from saved quotations or create one directly. Issued details are preserved when your profile or quotation changes.</Text>
    <Field label="Payment due (YYYY-MM-DD)" value={due} onChangeText={setDue} />
    <Button title="Create direct invoice" disabled={busy || !data.business} onPress={() => setCreating(true)} />
    {!data.business && <Text style={ui.muted}>Set up your business profile to create invoices.</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#A33124' }}>{error}</Text>}
    {invoices.map(i => <View key={i.id} style={ui.card}><Badge text="Issued" /><Text style={ui.title}>{i.number}</Text><Text style={ui.label}>{i.title}</Text><Text style={ui.muted}>{i.customer.name} · Due {i.due}</Text><Text style={ui.title}>{money(quoteTotals(i.lines, i.discount).total)}</Text><Button title="Export invoice PDF" disabled={busy} onPress={() => pdf(i)} /></View>)}
    {!invoices.length && <Text style={ui.muted}>No invoices issued yet.</Text>}
    <Text style={ui.title}>Invoice a quotation</Text>
    {data.quotes.filter(q => !invoices.some(i => i.quoteId === q.id)).map(q => <View key={q.id} style={ui.card}><Text style={ui.label}>{q.title}</Text><Text style={ui.muted}>{data.customers.find(c => c.id === q.customerId)?.name}</Text><Button title="Create invoice from quotation" disabled={busy || !data.business} onPress={() => { void create(q).catch(() => {}); }} /></View>)}
    <Button title="Back to workspace" secondary disabled={busy} onPress={onClose} />
  </ScrollView>;
}
