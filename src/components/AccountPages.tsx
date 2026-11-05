import React, { useState } from "react";
import { Switch, Text, View } from "react-native";
import { AppData } from "../domain/model";
import { money } from "../domain/money";
import { invoiceBalance } from "../domain/payments";
import { changePassword, currentAccount } from "../data/account";
import { exportExcel } from "../data/excel";
import {
  Badge,
  Banner,
  Button,
  Chips,
  EmptyState,
  Field,
  SectionHeader,
  colors,
  ui,
} from "./ui";
import { TaskSummary } from "./WorkManagement";

type Feedback = { text: string; tone: "green" | "danger" } | null;

const plans = [
  {
    name: "Free",
    price: 0,
    features: [
      "10 documents each month",
      "Customers and job tracking",
      "PDF and Excel exports",
      "3 free document templates",
    ],
  },
  {
    name: "Starter",
    price: 2000,
    features: [
      "Proposed: 50 documents each month",
      "Proposed: reusable service catalogue",
      "10 additional templates after verified payment",
    ],
  },
  {
    name: "Pro",
    price: 5000,
    features: [
      "Proposed: unlimited documents",
      "Proposed: recurring invoice drafts",
      "Proposed: advanced reports and priority support",
      "10 additional templates after verified payment",
    ],
  },
];

export function AccountPages({
  page,
  data,
  commit,
  logout,
}: {
  page: string;
  data: AppData;
  commit: (d: AppData) => Promise<void>;
  logout: () => void;
}) {
  const [annual, setAnnual] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [prefs, setPrefs] = useState(
    data.preferences ?? {
      paymentMethod: "Airtel Money",
      paymentPhone: "",
      dueDays: "14",
      compact: false,
    },
  );
  const busy = busyKey !== null;
  const dirty =
    JSON.stringify(prefs) !==
    JSON.stringify(
      data.preferences ?? {
        paymentMethod: "Airtel Money",
        paymentPhone: "",
        dueDays: "14",
        compact: false,
      },
    );

  async function run(
    key: string,
    action: () => Promise<void>,
    success: string,
  ) {
    if (busy) return;
    setBusyKey(key);
    setFeedback(null);
    try {
      await action();
      setFeedback({ text: success, tone: "green" });
    } catch (e) {
      setFeedback({
        text: e instanceof Error ? e.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setBusyKey(null);
    }
  }

  const invoices = data.invoices ?? [];
  const balances = invoices.map((i) => ({
    invoice: i,
    ...invoiceBalance(data, i),
  }));
  const totals = balances.reduce(
    (s, b) => ({
      billed: s.billed + b.total,
      paid: s.paid + b.paid,
      due: s.due + b.due,
    }),
    { billed: 0n, paid: 0n, due: 0n },
  );
  const collectedPct =
    totals.billed > 0n ? Number((totals.paid * 100n) / totals.billed) : 0;
  const outstanding = balances.filter((b) => b.due > 0n);

  return (
    <View style={{ gap: 20 }}>
      {page === "Reports" && <TaskSummary data={data} />}
      {feedback && (
        <Banner
          tone={feedback.tone}
          text={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {page === "Plans" && (
        <>
          <Badge text="ROOM TO GROW" />
          <Text style={[ui.title, { fontSize: 32 }]}>
            A small price for less paperwork.
          </Text>
          <Text style={ui.muted}>
            Proposed plans for independent workers and growing businesses. Your
            records and basic exports remain accessible on every plan.
          </Text>
          <Chips
            items={["Monthly", "Annually · save 2 months"]}
            value={annual ? "Annually · save 2 months" : "Monthly"}
            onChange={(v) => setAnnual(v !== "Monthly")}
          />
          <View style={[ui.row, { alignItems: "stretch" }]}>
            {plans.map((p) => {
              const selected = data.planRequest?.plan === p.name;
              return (
                <View
                  key={p.name}
                  style={[
                    ui.card,
                    {
                      flex: 1,
                      minWidth: 240,
                      borderColor:
                        p.name === "Pro" || selected
                          ? colors.green
                          : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                >
                  <Badge
                    text={
                      selected
                        ? "YOUR INTEREST"
                        : p.name === "Pro"
                          ? "FOR GROWING BUSINESSES"
                          : p.name.toUpperCase()
                    }
                    tone={selected ? "info" : "green"}
                  />
                  <Text style={ui.title}>{p.name}</Text>
                  <Text style={[ui.title, { fontSize: 30 }]}>
                    {money(BigInt(p.price * (annual ? 10 : 1)) * 100n)}
                  </Text>
                  <Text style={ui.muted}>
                    {annual ? "per year · billed annually" : "per month"}
                  </Text>
                  {p.features.map((f) => (
                    <Text key={f} style={ui.muted}>
                      ✓ {f}
                    </Text>
                  ))}
                  <Button
                    title={
                      p.price
                        ? `Register interest in ${p.name}`
                        : "Current free access"
                    }
                    disabled={busy || !p.price}
                    loading={busyKey === `plan-${p.name}`}
                    onPress={() =>
                      void run(
                        `plan-${p.name}`,
                        () =>
                          commit({
                            ...data,
                            planRequest: {
                              plan: p.name,
                              annual,
                              requestedAt: new Date().toISOString(),
                            },
                          }),
                        "Plan interest saved. No charge was made. Paid templates unlock only after payment verification.",
                      )
                    }
                  />
                </View>
              );
            })}
          </View>
          <Text style={ui.muted}>
            Subscriptions are manually verified while checkout is being
            connected. Prices and limits are proposals; three document templates
            are free, while the other ten require an active payment-verified
            subscription. Airtel Money and TNM Mpamba collection will require a
            connected payment provider.
          </Text>
          {data.planRequest && (
            <Text style={ui.label}>
              Your interest: {data.planRequest.plan} ·{" "}
              {data.planRequest.annual ? "annual" : "monthly"}
            </Text>
          )}
        </>
      )}

      {page === "Settings" && (
        <View style={ui.card}>
          <Text style={ui.title}>Make it work your way</Text>
          <Text style={ui.muted}>
            Currency: Malawian kwacha (MWK) · Timezone: Africa/Blantyre
          </Text>
          <Field
            label="Default payment term (days)"
            value={prefs.dueDays}
            onChangeText={(dueDays) => setPrefs({ ...prefs, dueDays })}
            numeric
            hint="Whole days from 1 to 999. Used as the default invoice due date."
          />
          <Text style={ui.label}>Preferred payment method</Text>
          <Chips
            items={["Airtel Money", "TNM Mpamba", "Bank transfer", "Cash"]}
            value={prefs.paymentMethod}
            onChange={(paymentMethod) => setPrefs({ ...prefs, paymentMethod })}
          />
          <Field
            label="Payment phone / account details"
            value={prefs.paymentPhone}
            onChangeText={(paymentPhone) =>
              setPrefs({ ...prefs, paymentPhone })
            }
            hint="Shown on your invoices so customers know where to pay."
          />
          <View style={ui.row}>
            <Switch
              accessibilityLabel="Compact lists"
              value={prefs.compact}
              onValueChange={(compact) => setPrefs({ ...prefs, compact })}
            />
            <Text style={ui.label}>Compact list spacing</Text>
          </View>
          <View style={ui.row}>
            <Button
              title="Save preferences"
              disabled={busy || !dirty}
              loading={busyKey === "prefs"}
              onPress={() =>
                void run(
                  "prefs",
                  async () => {
                    if (
                      !/^\d{1,3}$/.test(prefs.dueDays) ||
                      Number(prefs.dueDays) < 1
                    )
                      throw new Error(
                        "Enter payment terms from 1 to 999 days.",
                      );
                    await commit({ ...data, preferences: prefs });
                  },
                  "Preferences saved.",
                )
              }
            />
            {dirty && <Badge text="Unsaved changes" tone="warn" />}
          </View>
          <Text style={ui.muted}>
            Tax is off. These documents are not MRA-certified electronic tax
            invoices.
          </Text>
        </View>
      )}

      {page === "Profile" && (
        <View style={ui.card}>
          <Badge text="SIGNED IN" />
          <Text style={ui.title}>{data.business?.owner || "Your profile"}</Text>
          <Text style={ui.muted}>{currentAccount()?.email || ""}</Text>
          <Text style={ui.muted}>
            {data.business?.name ||
              "Use Business profile to add your trading name, logo and contact details."}
          </Text>
          {currentAccount() && (
            <>
              <Field
                label="New password"
                secure
                value={password}
                onChangeText={setPassword}
                hint="At least 8 characters."
              />
              <Field
                label="Confirm new password"
                secure
                value={confirm}
                onChangeText={setConfirm}
                error={
                  confirm && confirm !== password
                    ? "Passwords do not match."
                    : undefined
                }
              />
              <Button
                title="Update password"
                disabled={busy || !password}
                loading={busyKey === "password"}
                onPress={() =>
                  void run(
                    "password",
                    async () => {
                      if (password.length < 8)
                        throw new Error("Use at least 8 characters.");
                      if (password !== confirm)
                        throw new Error("Passwords do not match.");
                      await changePassword(password);
                      setPassword("");
                      setConfirm("");
                    },
                    "Password updated.",
                  )
                }
              />
            </>
          )}
          <Button
            title="Sign out"
            variant="danger"
            disabled={busy}
            onPress={logout}
          />
          <Text style={ui.muted}>
            Sessions end when the app restarts. Passwords and access tokens are
            never written to local workspace storage.
          </Text>
        </View>
      )}

      {page === "Reports" && (
        <>
          <SectionHeader title="Know where your money stands." />
          <View style={ui.row}>
            {(
              [
                ["Invoiced", totals.billed],
                ["Recorded collections", totals.paid],
                ["Outstanding", totals.due],
              ] as [string, bigint][]
            ).map(([label, value]) => (
              <View key={label} style={[ui.card, { flex: 1, minWidth: 220 }]}>
                <Text style={ui.muted}>{label}</Text>
                <Text style={ui.title}>{money(value)}</Text>
              </View>
            ))}
          </View>
          {totals.billed > 0n && (
            <View style={ui.card}>
              <View style={[ui.row, { justifyContent: "space-between" }]}>
                <Text style={ui.label}>Collected so far</Text>
                <Text style={ui.label}>{collectedPct}%</Text>
              </View>
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: collectedPct }}
                style={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#E8EFDE",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.min(collectedPct, 100)}%`,
                    height: "100%",
                    backgroundColor: colors.green,
                  }}
                />
              </View>
            </View>
          )}
          <Text style={ui.muted}>
            Based on saved invoices and manually recorded payments. This is not
            a profit or tax report.
          </Text>
          <Button
            title="Download Excel workbook"
            disabled={busy}
            loading={busyKey === "excel"}
            onPress={() =>
              void run(
                "excel",
                () => exportExcel(data),
                "Excel export prepared.",
              )
            }
          />
          <SectionHeader title="Outstanding invoices" />
          {outstanding.map(({ invoice: i, due }) => (
            <View key={i.id} style={ui.card}>
              <Text style={ui.label}>
                {i.number} · {i.customer.name}
              </Text>
              <Text style={ui.muted}>
                Due {i.due} · {money(due)}
              </Text>
            </View>
          ))}
          {!outstanding.length && (
            <EmptyState
              title={
                invoices.length ? "Nothing outstanding" : "No invoices yet"
              }
              body={
                invoices.length
                  ? "Every saved invoice is fully paid."
                  : "Create your first invoice to see your balances here."
              }
            />
          )}
        </>
      )}
    </View>
  );
}
