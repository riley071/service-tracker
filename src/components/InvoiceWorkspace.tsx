import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { AppData, Invoice, Quote } from "../domain/model";
import { issueInvoice } from "../domain/documents";
import { money, quoteTotals } from "../domain/money";
import { exportWithTemplate } from "../data/exportTemplate";
import { TemplatePicker } from "./TemplatePicker";
import { invoiceBalance, paymentCents } from "../domain/payments";
import { id, validDate } from "../domain/model";
import { localDay } from "../domain/tasks";
import {
  Badge,
  Banner,
  Button,
  Chips,
  EmptyState,
  Field,
  SectionHeader,
  ui,
} from "./ui";
import { Editor } from "./Editor";

/** Local-time YYYY-MM-DD offset from today (avoids the UTC date flip after 22:00 in Malawi). */
function daysFromToday(days: number) {
  const d = new Date(`${localDay()}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cents as a plain decimal string, e.g. 150050n -> "1500.50". */
function centsToDecimal(cents: bigint) {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

export function InvoiceWorkspace({
  data,
  commit,
  onClose,
}: {
  data: AppData;
  commit: (d: AppData) => Promise<void>;
  onClose: () => void;
}) {
  const [templateInvoice, setTemplateInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(localDay());
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [due, setDue] = useState(() =>
    daysFromToday(Number(data.preferences?.dueDays ?? "14") || 14),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const invoices = data.invoices ?? [];
  const today = localDay();

  const rows = useMemo(
    () =>
      invoices.map((invoice) => {
        const b = invoiceBalance(data, invoice);
        const status =
          b.due === 0n
            ? "Paid"
            : b.paid > 0n
              ? "Part paid"
              : invoice.due < today
                ? "Overdue"
                : "Unpaid";
        return { invoice, balance: b, status };
      }),
    [invoices, data, today],
  );

  async function create(q: Quote) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (!validDate(due))
        throw new Error("Enter a real due date in YYYY-MM-DD format.");
      if (!data.business) throw new Error("Save your business profile first.");
      const customer = data.customers.find((c) => c.id === q.customerId);
      if (!customer) throw new Error("Select an existing customer.");
      if (invoices.some((i) => i.quoteId === q.id))
        throw new Error("This quotation already has an invoice.");
      const invoice = issueInvoice(
        q,
        {
          ...data.business,
          paymentDetails:
            data.business.paymentDetails ||
            (data.preferences?.paymentPhone
              ? `${data.preferences.paymentMethod}: ${data.preferences.paymentPhone}`
              : ""),
        },
        customer,
        invoices,
        due,
      );
      await commit({ ...data, invoices: [invoice, ...invoices] });
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invoice.");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function pdf(i: Invoice, templateId: string) {
    setBusy(true);
    setError("");
    try {
      await exportWithTemplate(
        i,
        "Invoice",
        templateId,
        invoiceBalance(data, i).paid,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export invoice.");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment() {
    if (!paymentInvoice || busy) return;
    setBusy(true);
    setError("");
    try {
      const cents = paymentCents(amount);
      if (cents <= 0n) throw new Error("Enter the amount you received.");
      if (cents > invoiceBalance(data, paymentInvoice).due)
        throw new Error(
          "Payment exceeds the remaining balance. Customer credit is not supported yet.",
        );
      if (!validDate(paymentDate) || paymentDate > localDay())
        throw new Error("Use a valid payment date, no later than today.");
      if (method !== "Cash" && !reference.trim())
        throw new Error("Add the transaction reference.");
      await commit({
        ...data,
        payments: [
          ...(data.payments ?? []),
          {
            id: id(),
            invoiceId: paymentInvoice.id,
            amount,
            date: paymentDate,
            method,
            reference: reference.trim(),
          },
        ],
      });
      setPaymentInvoice(null);
      setAmount("");
      setReference("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    } finally {
      setBusy(false);
    }
  }

  if (paymentInvoice) {
    const remaining = invoiceBalance(data, paymentInvoice).due;
    return (
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={ui.title}>
          Record a payment
        </Text>
        <Text style={ui.muted}>
          {paymentInvoice.number} · Remaining {money(remaining)}
        </Text>
        <Banner
          tone="info"
          text="Only record money you have confirmed receiving. This does not charge the customer."
        />
        <Field
          label="Amount received (MWK)"
          value={amount}
          onChangeText={setAmount}
          numeric
        />
        <Button
          title={`Fill full balance (${money(remaining)})`}
          secondary
          onPress={() => setAmount(centsToDecimal(remaining))}
        />
        <Field
          label="Payment date (YYYY-MM-DD)"
          value={paymentDate}
          onChangeText={setPaymentDate}
        />
        <Text style={ui.label}>Method</Text>
        <Chips
          items={["Cash", "Airtel Money", "TNM Mpamba", "Bank transfer"]}
          value={method}
          onChange={setMethod}
        />
        <Field
          label={
            method === "Cash"
              ? "Receipt note (optional)"
              : "Transaction reference *"
          }
          value={reference}
          onChangeText={setReference}
        />
        {!!error && (
          <Banner tone="danger" text={error} onDismiss={() => setError("")} />
        )}
        <View style={ui.row}>
          <Button
            title="Confirm received payment"
            loading={busy}
            onPress={() => void recordPayment()}
          />
          <Button
            title="Cancel"
            secondary
            disabled={busy}
            onPress={() => {
              setPaymentInvoice(null);
              setError("");
            }}
          />
        </View>
      </ScrollView>
    );
  }

  if (creating)
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Field
            label="Payment due (YYYY-MM-DD)"
            value={due}
            onChangeText={setDue}
          />
        </View>
        <Editor
          kind="quote"
          data={data}
          onSave={(value) => create(value as Quote)}
          onCancel={() => setCreating(false)}
          documentKind="invoice"
        />
      </View>
    );

  const needle = search.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (statusFilter === "All" || r.status === statusFilter) &&
      `${r.invoice.number} ${r.invoice.customer.name} ${r.invoice.title}`
        .toLowerCase()
        .includes(needle),
  );
  const uninvoiced = data.quotes.filter(
    (q) => !invoices.some((i) => i.quoteId === q.id),
  );
  const payments = (data.payments ?? [])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 18 }}
      keyboardShouldPersistTaps="handled"
    >
      {templateInvoice && (
        <TemplatePicker
          onUpgrade={onClose}
          onClose={() => setTemplateInvoice(null)}
          onExport={(templateId) => pdf(templateInvoice, templateId)}
        />
      )}
      <SectionHeader title="Invoices" />
      <Text style={ui.muted}>
        Issue invoices from saved quotations or create one directly. Issued
        details are preserved when your profile or quotation changes.
      </Text>
      <Field
        label="Payment due (YYYY-MM-DD)"
        value={due}
        onChangeText={setDue}
      />
      <Chips
        items={["14 days", "30 days", "Due today"]}
        value=""
        onChange={(k) =>
          setDue(daysFromToday(k === "14 days" ? 14 : k === "30 days" ? 30 : 0))
        }
      />
      <Button
        title="+ Create direct invoice"
        disabled={busy || !data.business}
        onPress={() => {
          setError("");
          setCreating(true);
        }}
      />
      {!data.business && (
        <Banner
          tone="warn"
          text="Set up your business profile to create invoices."
        />
      )}
      {!!error && (
        <Banner tone="danger" text={error} onDismiss={() => setError("")} />
      )}

      {!!invoices.length && (
        <>
          <Field
            label="Search invoices"
            value={search}
            onChangeText={setSearch}
          />
          <Chips
            items={["All", "Unpaid", "Part paid", "Overdue", "Paid"]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </>
      )}
      {shown.map(({ invoice: i, balance, status }) => (
        <View key={i.id} style={ui.card}>
          <Badge
            text={status}
            tone={
              status === "Paid"
                ? "green"
                : status === "Overdue"
                  ? "danger"
                  : status === "Part paid"
                    ? "info"
                    : "warn"
            }
          />
          <Text style={ui.title}>{i.number}</Text>
          <Text style={ui.label}>{i.title}</Text>
          <Text style={ui.muted}>
            {i.customer.name} · Due {i.due}
          </Text>
          <Text style={ui.title}>
            {money(quoteTotals(i.lines, i.discount).total)}
          </Text>
          <Text style={ui.label}>Remaining: {money(balance.due)}</Text>
          <View style={ui.row}>
            {balance.due > 0n && (
              <Button
                title="Record payment"
                disabled={busy}
                onPress={() => {
                  setError("");
                  setPaymentDate(localDay());
                  setPaymentInvoice(i);
                }}
              />
            )}
            <Button
              title="Export invoice PDF"
              secondary
              disabled={busy}
              onPress={() => setTemplateInvoice(i)}
            />
          </View>
        </View>
      ))}
      {!shown.length && (
        <EmptyState
          title={
            invoices.length ? "No invoices match" : "No invoices issued yet"
          }
          body={
            invoices.length
              ? "Try a different search or status."
              : "Create a direct invoice, or invoice one of your saved quotations below."
          }
        />
      )}

      <SectionHeader title="Payment history" />
      {payments.map((p) => (
        <View key={p.id} style={ui.card}>
          <Text style={ui.label}>
            {invoices.find((i) => i.id === p.invoiceId)?.number ?? "Invoice"} ·{" "}
            {money(paymentCents(p.amount))}
          </Text>
          <Text style={ui.muted}>
            {p.date} · {p.method} · {p.reference || "Cash receipt"}
          </Text>
        </View>
      ))}
      {!payments.length && (
        <Text style={ui.muted}>No payments recorded yet.</Text>
      )}

      <SectionHeader title="Invoice a quotation" />
      {uninvoiced.map((q) => (
        <View key={q.id} style={ui.card}>
          <Text style={ui.label}>{q.title}</Text>
          <Text style={ui.muted}>
            {data.customers.find((c) => c.id === q.customerId)?.name ??
              "Unknown customer"}{" "}
            · {money(quoteTotals(q.lines, q.discount).total)}
          </Text>
          <Button
            title="Create invoice from quotation"
            disabled={busy || !data.business}
            onPress={() => {
              void create(q).catch(() => {});
            }}
          />
        </View>
      ))}
      {!uninvoiced.length && (
        <Text style={ui.muted}>Every saved quotation has been invoiced.</Text>
      )}
      <Button
        title="Back to workspace"
        secondary
        disabled={busy}
        onPress={onClose}
      />
    </ScrollView>
  );
}
