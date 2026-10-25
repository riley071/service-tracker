import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { AppData, Invoice, Quote } from '../domain/model';
import { issueInvoice } from '../domain/documents';
import { money, quoteTotals } from '../domain/money';
import { exportWithTemplate } from '../data/exportTemplate';
import { TemplatePicker } from './TemplatePicker';
import { invoiceBalance, paymentCents } from '../domain/payments';
import { id, validDate } from '../domain/model';
import { Badge, Button, Chips, Field, ui } from './ui';
import { Editor } from './Editor';

export function InvoiceWorkspace({ data, commit, onClose }: { data: AppData; commit: (d: AppData) => Promise<void>; onClose: () => void }) {
  const [templateInvoice, setTemplateInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [due, setDue] = useState(() => new Date(Date.now() + Number(data.preferences?.dueDays ?? '14') * 86400000).toISOString().slice(0, 10));
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
      const invoice = issueInvoice(q, { ...data.business, paymentDetails: data.business.paymentDetails || (data.preferences?.paymentPhone ? `${data.preferences.paymentMethod}: ${data.preferences.paymentPhone}` : '') }, customer, invoices, due);
      await commit({ ...data, invoices: [invoice, ...invoices] });
      setCreating(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create invoice.'); throw e; }
    finally { setBusy(false); }
  }
  async function pdf(i: Invoice, templateId: string) {
    setBusy(true); setError('');
    try { await exportWithTemplate(i, 'Invoice', templateId, invoiceBalance(data, i).paid); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not export invoice.'); throw e; }
    finally { setBusy(false); }
  }
  async function recordPayment() {
    if (!paymentInvoice || busy) return;
    setBusy(true); setError('');
    try {
      const cents = paymentCents(amount);
      if (cents > invoiceBalance(data, paymentInvoice).due) throw new Error('Payment exceeds the remaining balance. Customer credit is not supported yet.');
      if (!validDate(paymentDate) || paymentDate > new Date().toISOString().slice(0,10)) throw new Error('Use a valid payment date, no later than today.');
      if (method !== 'Cash' && !reference.trim()) throw new Error('Add the transaction reference.');
      await commit({ ...data, payments: [...(data.payments ?? []), { id: id(), invoiceId: paymentInvoice.id, amount, date: paymentDate, method, reference: reference.trim() }] });
      setPaymentInvoice(null); setAmount(''); setReference('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not record payment.'); }
    finally { setBusy(false); }
  }
  if (paymentInvoice) return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}><Text style={ui.title}>Record a payment</Text><Text style={ui.muted}>{paymentInvoice.number} ? Remaining {money(invoiceBalance(data, paymentInvoice).due)}</Text><Text style={ui.muted}>Only record money you have confirmed receiving. This does not charge the customer.</Text><Field label="Amount received (MWK)" value={amount} onChangeText={setAmount} numeric /><Field label="Payment date (YYYY-MM-DD)" value={paymentDate} onChangeText={setPaymentDate} /><Chips items={['Cash', 'Airtel Money', 'TNM Mpamba', 'Bank transfer']} value={method} onChange={setMethod} /><Field label="Transaction reference / receipt note" value={reference} onChangeText={setReference} />{!!error && <Text accessibilityRole="alert">{error}</Text>}<Button title="Confirm received payment" disabled={busy} onPress={() => void recordPayment()} /><Button title="Cancel" secondary disabled={busy} onPress={() => { setPaymentInvoice(null); setError(''); }} /></ScrollView>;
  if (creating) return <View style={{ flex: 1 }}><Field label="Payment due (YYYY-MM-DD)" value={due} onChangeText={setDue} /><Editor kind="quote" data={data} onSave={value => create(value as Quote)} onCancel={() => setCreating(false)} documentKind="invoice" /></View>;
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
    {templateInvoice && <TemplatePicker onUpgrade={onClose} onClose={() => setTemplateInvoice(null)} onExport={templateId => pdf(templateInvoice, templateId)} />}
    <Text style={ui.title}>Invoices</Text><Text style={ui.muted}>Issue invoices from saved quotations or create one directly. Issued details are preserved when your profile or quotation changes.</Text>
    <Field label="Payment due (YYYY-MM-DD)" value={due} onChangeText={setDue} />
    <Button title="Create direct invoice" disabled={busy || !data.business} onPress={() => setCreating(true)} />
    {!data.business && <Text style={ui.muted}>Set up your business profile to create invoices.</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#A33124' }}>{error}</Text>}
    <Field label="Search invoices" value={search} onChangeText={setSearch} />
    {invoices.filter(i => `${i.number} ${i.customer.name} ${i.title}`.toLowerCase().includes(search.toLowerCase())).map(i => <View key={i.id} style={ui.card}><Badge text={invoiceBalance(data, i).due === 0n ? 'Paid' : invoiceBalance(data, i).paid > 0n ? 'Part paid' : i.due < new Date().toISOString().slice(0,10) ? 'Overdue' : 'Unpaid'} /><Text style={ui.title}>{i.number}</Text><Text style={ui.label}>{i.title}</Text><Text style={ui.muted}>{i.customer.name} · Due {i.due}</Text><Text style={ui.title}>{money(quoteTotals(i.lines, i.discount).total)}</Text><Text style={ui.label}>Remaining: {money(invoiceBalance(data, i).due)}</Text>{invoiceBalance(data, i).due > 0n && <Button title="Record payment" disabled={busy} secondary onPress={() => setPaymentInvoice(i)} />}<Button title="Export invoice PDF" disabled={busy} onPress={() => setTemplateInvoice(i)} /></View>)}
    {!invoices.length && <Text style={ui.muted}>No invoices issued yet.</Text>}
    <Text style={ui.title}>Payment history</Text>
    {(data.payments ?? []).slice().reverse().map(p => <View key={p.id} style={ui.card}><Text style={ui.label}>{invoices.find(i => i.id === p.invoiceId)?.number} ? {money(paymentCents(p.amount))}</Text><Text style={ui.muted}>{p.date} ? {p.method} ? {p.reference || 'Cash receipt'}</Text></View>)}
    <Text style={ui.title}>Invoice a quotation</Text>
    {data.quotes.filter(q => !invoices.some(i => i.quoteId === q.id)).map(q => <View key={q.id} style={ui.card}><Text style={ui.label}>{q.title}</Text><Text style={ui.muted}>{data.customers.find(c => c.id === q.customerId)?.name}</Text><Button title="Create invoice from quotation" disabled={busy || !data.business} onPress={() => { void create(q).catch(() => {}); }} /></View>)}
    <Button title="Back to workspace" secondary disabled={busy} onPress={onClose} />
  </ScrollView>;
}
