import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Banner, Button, Chips, Field, ui } from "./ui";
import { id, normalisePhone, validDate } from "../domain/model";
import { ServiceSelect } from "./ServiceSelect";
import type {
  AppData,
  Customer,
  Job,
  Quote,
  QuoteLine,
  Trade,
} from "../domain/model";
import { money, quoteTotals } from "../domain/money";
import { localDay } from "../domain/tasks";

export type EditorKind = "customer" | "quote" | "job";

function shiftDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function Editor({
  kind,
  data,
  onSave,
  onCancel,
  quote,
  customer,
  job,
  documentKind = "quote",
}: {
  kind: EditorKind;
  data: AppData;
  onSave: (value: Customer | Quote | Job) => Promise<void>;
  onCancel: () => void;
  quote?: Quote;
  /** Pass an existing customer to edit it instead of creating a new one. */
  customer?: Customer;
  /** Pass an existing job to edit it instead of creating a new one. */
  job?: Job;
  documentKind?: "quote" | "invoice";
}) {
  const existing =
    kind === "customer" ? customer : kind === "job" ? job : quote;
  const [name, setName] = useState(
    customer?.name ?? job?.title ?? quote?.title ?? "",
  );
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [site, setSite] = useState(customer?.site ?? "");
  const [customerId, setCustomer] = useState(
    quote?.customerId ?? job?.customerId ?? data.customers[0]?.id ?? "",
  );
  const [trade, setTrade] = useState<Trade>(
    quote?.trade ?? job?.trade ?? "Painting",
  );
  const [due, setDue] = useState(job?.due ?? localDay());
  const [note, setNote] = useState(job?.note ?? "");
  const [discount, setDiscount] = useState(quote?.discount ?? "0");
  const [lines, setLines] = useState<QuoteLine[]>(
    quote?.lines.map((l) => ({ ...l })) ?? [
      { id: id(), description: "", quantity: "1", unit: "job", price: "" },
    ],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Chip labels must be unique, otherwise two customers with the same name and
  // phone could not be told apart.
  const customerOptions = useMemo(() => {
    const seen: Record<string, number> = {};
    return data.customers.map((c) => {
      const base = c.phone ? `${c.name} · ${c.phone}` : c.name;
      seen[base] = (seen[base] ?? 0) + 1;
      return {
        id: c.id,
        label: seen[base] > 1 ? `${base} (${seen[base]})` : base,
      };
    });
  }, [data.customers]);

  function updateLine(key: string, patch: Partial<QuoteLine>) {
    setLines((rows) =>
      rows.map((l) => (l.id === key ? { ...l, ...patch } : l)),
    );
  }

  let total = "Add items to calculate your total";
  try {
    total = money(quoteTotals(lines, discount).total);
  } catch {
    /* Incomplete input: keep the placeholder. */
  }

  const noun =
    kind === "customer" ? "customer" : kind === "job" ? "job" : "quotation";

  async function save() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (!name.trim())
        throw new Error(
          kind === "customer"
            ? "Enter the customer name."
            : "Enter a title for this work.",
        );
      if (kind === "customer") {
        await onSave({
          id: customer?.id ?? id(),
          name: name.trim(),
          phone: normalisePhone(phone),
          site: site.trim(),
        });
        return;
      }
      if (!trade.trim()) throw new Error("Enter a service name.");
      if (!data.customers.some((c) => c.id === customerId))
        throw new Error("Add and select a customer first.");
      if (kind === "quote") {
        quoteTotals(lines, discount);
        if (lines.some((l) => !l.description.trim()))
          throw new Error("Give every item a description, or remove it.");
        await onSave({
          id: quote?.id ?? id(),
          customerId,
          title: name.trim(),
          trade: trade.trim(),
          lines: lines.map((l) => ({
            ...l,
            description: l.description.trim(),
          })),
          discount,
          createdAt: quote?.createdAt ?? new Date().toISOString(),
          status: quote?.status ?? "Draft",
        });
      } else {
        if (!validDate(due))
          throw new Error("Enter a real date in YYYY-MM-DD format.");
        await onSave({
          id: job?.id ?? id(),
          customerId,
          title: name.trim(),
          trade: trade.trim(),
          due,
          // Editing keeps the job's current progress.
          status: job?.status ?? "Scheduled",
          note: note.trim(),
        });
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your input is still here.",
      );
    } finally {
      setBusy(false);
    }
  }

  const heading =
    kind === "customer"
      ? customer
        ? "Edit customer"
        : "New customer"
      : kind === "quote"
        ? quote
          ? "Edit quotation draft"
          : documentKind === "invoice"
            ? "New invoice"
            : "New quotation"
        : job
          ? "Edit job"
          : "New direct job";

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, gap: 12 }}
    >
      <Text accessibilityRole="header" style={ui.title}>
        {heading}
      </Text>
      <Text style={ui.muted}>
        {kind === "quote"
          ? documentKind === "invoice"
            ? "Review items and totals before issuing your invoice."
            : "Build a clear scope and export a professional quotation."
          : kind === "job"
            ? "Record agreed work without claiming online customer approval."
            : "Keep your customer and site details together."}
      </Text>
      <Field
        label={kind === "customer" ? "Customer name" : "Work title"}
        value={name}
        onChangeText={setName}
      />
      {kind === "customer" ? (
        <>
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="0881 234 567"
            hint="Malawi numbers are tidied up automatically."
          />
          <Field label="Site / area" value={site} onChangeText={setSite} />
        </>
      ) : (
        <>
          <Text style={ui.label}>Customer</Text>
          {customerOptions.length ? (
            <Chips
              items={customerOptions.map((c) => c.label)}
              value={
                customerOptions.find((c) => c.id === customerId)?.label ?? ""
              }
              onChange={(label) => {
                const match = customerOptions.find((c) => c.label === label);
                if (match) setCustomer(match.id);
              }}
            />
          ) : (
            <Banner
              tone="warn"
              text="Create a customer before saving this work."
            />
          )}
          <ServiceSelect value={trade} onChange={setTrade} />
          {kind === "job" ? (
            <>
              <Text style={ui.label}>Scheduled date</Text>
              <Chips
                items={["Today", "Tomorrow", "Next week"]}
                value={
                  due === localDay()
                    ? "Today"
                    : due === shiftDay(localDay(), 1)
                      ? "Tomorrow"
                      : due === shiftDay(localDay(), 7)
                        ? "Next week"
                        : ""
                }
                onChange={(k) =>
                  setDue(
                    k === "Today"
                      ? localDay()
                      : k === "Tomorrow"
                        ? shiftDay(localDay(), 1)
                        : shiftDay(localDay(), 7),
                  )
                }
              />
              <Field
                label="Or type a date (YYYY-MM-DD)"
                value={due}
                onChangeText={setDue}
                placeholder="2026-11-25"
              />
              <Field
                label="Job notes"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </>
          ) : (
            <>
              {lines.map((line, index) => (
                <View key={line.id} style={[ui.card, { padding: 16 }]}>
                  <Text style={ui.label}>Item {index + 1}</Text>
                  <Field
                    label="Description"
                    value={line.description}
                    onChangeText={(s) =>
                      updateLine(line.id, { description: s })
                    }
                  />
                  <View style={ui.row}>
                    <View style={{ flex: 1, minWidth: 90 }}>
                      <Field
                        label="Quantity"
                        value={line.quantity}
                        onChangeText={(s) =>
                          updateLine(line.id, { quantity: s })
                        }
                        numeric
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 90 }}>
                      <Field
                        label="Unit"
                        value={line.unit}
                        onChangeText={(s) => updateLine(line.id, { unit: s })}
                      />
                    </View>
                    <View style={{ flex: 2, minWidth: 140 }}>
                      <Field
                        label="Unit price (MWK)"
                        value={line.price}
                        onChangeText={(s) => updateLine(line.id, { price: s })}
                        numeric
                      />
                    </View>
                  </View>
                  {lines.length > 1 && (
                    <Button
                      title="Remove item"
                      variant="danger"
                      onPress={() =>
                        setLines((rows) => rows.filter((l) => l.id !== line.id))
                      }
                    />
                  )}
                </View>
              ))}
              <Button
                title="+ Add item"
                secondary
                onPress={() =>
                  setLines((rows) => [
                    ...rows,
                    {
                      id: id(),
                      description: "",
                      quantity: "1",
                      unit: "job",
                      price: "",
                    },
                  ])
                }
              />
              <Field
                label="Discount (%)"
                value={discount}
                onChangeText={setDiscount}
                numeric
              />
              <View style={ui.card}>
                <Text style={ui.muted}>Total</Text>
                <Text style={ui.title}>{total}</Text>
                <Text style={ui.muted}>
                  Tax not charged. Amounts are in MWK.
                </Text>
              </View>
            </>
          )}
        </>
      )}
      {!!error && (
        <Banner tone="danger" text={error} onDismiss={() => setError("")} />
      )}
      <View style={ui.row}>
        <Button
          title={
            documentKind === "invoice" && kind === "quote"
              ? "Issue invoice"
              : existing
                ? `Save ${noun}`
                : kind === "quote"
                  ? "Save draft"
                  : `Save ${noun}`
          }
          loading={busy}
          onPress={save}
        />
        <Button title="Cancel" secondary disabled={busy} onPress={onCancel} />
      </View>
    </ScrollView>
  );
}
