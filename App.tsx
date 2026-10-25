import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Badge, Button, Chips, colors, ui } from "./src/components/ui";
import { Editor } from "./src/components/Editor";
import type { EditorKind } from "./src/components/Editor";
import type {
  AppData,
  Customer,
  Job,
  JobStatus,
  Quote,
} from "./src/domain/model";
import { jobStatuses } from "./src/domain/model";
import { money, quoteTotals } from "./src/domain/money";
import { BusinessEditor } from "./src/components/BusinessEditor";
import { InvoiceWorkspace } from "./src/components/InvoiceWorkspace";
import { exportWithTemplate } from "./src/data/exportTemplate";
import { TemplatePicker } from "./src/components/TemplatePicker";
import { router, useGlobalSearchParams } from "expo-router";
import { Login } from "./src/components/Login";
import { AccountPages } from "./src/components/AccountPages";
import {
  cloudLoad,
  cloudSave,
  currentAccount,
  signOut,
} from "./src/data/account";
const pages = [
  "Overview",
  "Invoices",
  "Quotations",
  "Customers",
  "Jobs",
  "Reports",
  "Profile",
  "Settings",
  "Plans",
] as const;
type Page = (typeof pages)[number];
function AppContent() {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [data, setData] = useState<AppData | null>(null);
  const params = useGlobalSearchParams<{ section?: string }>();
  const page =
    pages.find((p) => p.toLowerCase() === params.section) ?? "Overview";
  function setPage(p: Page) {
    router.push({
      pathname: "/[section]",
      params: { section: p.toLowerCase() },
    });
  }
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorKind | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<"business" | "invoices" | null>(
    null,
  );
  const [templateQuote, setTemplateQuote] = useState<Quote | null>(null);
  const [exporting, setExporting] = useState(false);
  const mutationLock = useRef(false);
  useEffect(() => {
    if (!entered) return;
    let active = true;
    cloudLoad()
      .then((saved) => {
        if (active) setData(saved ?? { version: 1, customers: [], quotes: [], jobs: [], invoices: [], payments: [] });
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load your Supabase workspace. Check your connection and database setup.');
      });
    return () => { active = false; };
  }, [entered]);
  async function commit(next: AppData) {
    if (mutationLock.current)
      throw new Error("Another change is saving. Please try again.");
    mutationLock.current = true;
    setSaving(true);
    try {
      await cloudSave(next);
      setData(next);
      setMessage("Saved to your account");
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }
  async function logout() {
    try {
      await signOut();
    } catch {
      /* Local session is still cleared. */
    }
    setData(null);
    setEntered(false);
    setLoadError("");
    setMessage("");
    setEditor(null);
    setEditingQuote(undefined);
    setTemplateQuote(null);
    setSelectedJob(null);
    setWorkspace(null);
    setSearch("");
    setMenuOpen(false);
    router.replace("/");
  }
  if (!entered || !currentAccount()) return <Login onEnter={() => { if (currentAccount()) setEntered(true); }} />;
  if (loadError)
    return (
      <View style={styles.loading}>
        <Text accessibilityRole="alert" style={ui.title}>
          {loadError}
        </Text>
        <Button title="Back to sign in" onPress={() => void logout()} />
      </View>
    );
  if (!data)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
        <Text style={ui.muted}>Opening your workspace…</Text>
      </View>
    );
  const customer = (key: string) => data.customers.find((c) => c.id === key);
  const matches = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());
  const jobs = data.jobs.filter((j) => j.status !== "Completed");
  const draftValue = data.quotes.reduce(
    (sum, q) => sum + quoteTotals(q.lines, q.discount).total,
    0n,
  );
  const selected = data.jobs.find((j) => j.id === selectedJob);
  async function quotationPdf(q: Quote, templateId: string) {
    if (!data || exporting) throw new Error('Another export is already in progress.');
    setExporting(true);
    try {
      if (!data.business) throw new Error('Save your business profile before exporting a quotation.');
      const recipient = data.customers.find(c => c.id === q.customerId);
      if (!recipient) throw new Error('The quotation customer could not be found.');
      await exportWithTemplate({ ...q, number: `QUO-${q.id.toUpperCase()}`, issuedOn: q.createdAt.slice(0, 10), business: data.business, customer: recipient }, 'Quotation', templateId);
    } finally { setExporting(false); }
  }
  function open(kind: EditorKind, q?: Quote) {
    setEditingQuote(q);
    setEditor(kind);
  }
  async function saveRecord(value: Customer | Quote | Job) {
    if (!data) return;
    let next: AppData;
    if (editor === "customer")
      next = { ...data, customers: [...data.customers, value as Customer] };
    else if (editor === "quote") {
      const q = value as Quote;
      next = {
        ...data,
        quotes: data.quotes.some((x) => x.id === q.id)
          ? data.quotes.map((x) => (x.id === q.id ? q : x))
          : [q, ...data.quotes],
      };
    } else next = { ...data, jobs: [value as Job, ...data.jobs] };
    await commit(next);
    setPage(
      editor === "customer"
        ? "Customers"
        : editor === "quote"
          ? "Quotations"
          : "Jobs",
    );
    setEditor(null);
    setSearch("");
  }
  async function updateStatus(status: JobStatus) {
    if (!data || !selected) return;
    try {
      await commit({
        ...data,
        jobs: data.jobs.map((j) =>
          j.id === selected.id ? { ...j, status } : j,
        ),
      });
    } catch {
      setMessage("Could not save status. Please try again.");
    }
  }
  const nav = (
    <>
      {pages.map((p) => (
          <Pressable
            key={p}
            accessibilityRole="button"
            accessibilityState={{ selected: page === p }}
            onPress={() => {
              setPage(p);
              setMenuOpen(false);
              setSearch("");
              setFilter("All");
            }}
            style={[
              styles.navItem,
              page === p && styles.navActive,

            ]}
          >
            <Text
              style={[
                styles.navText,
                page === p && { color: colors.green, fontWeight: "700" },
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
    </>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark" />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View style={styles.sidebar}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Text
                  style={{ fontSize: 22, color: "white", fontWeight: "800" }}
                >
                  w
                </Text>
              </View>
              <Text style={[ui.title, { fontSize: 22 }]}>Workfolio</Text>
            </View>
            <Text style={styles.eyebrow}>YOUR WORKSPACE</Text>
            <View style={{ gap: 6 }}>{nav}</View>
            <View style={{ flex: 1 }} />
            <View style={styles.sideFooter}>
              <Badge text="YOUR BUSINESS" />
              <Text style={ui.muted}>
                A clearer view of your work, from first quote to finish.
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Built for service businesses
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={[styles.topbar, { paddingHorizontal: desktop ? 36 : 20 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              {!desktop && <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.65 : 1 }]}>
                <View accessible={false} style={{ gap: 5 }}><View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} /></View>
              </Pressable>}
            <Text numberOfLines={1} style={[ui.muted, { flexShrink: 1 }]}>
              {desktop ? "Workspace  /  " : ""}
              <Text style={{ color: colors.ink, fontWeight: "600" }}>
                {page}
              </Text>
            </Text>
            </View>
            <View style={ui.row}>
              {desktop && <><View style={styles.dot} />
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {saving ? "Saving..." : "Cloud workspace"}
              </Text></>}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => setPage("Profile")}
                style={styles.avatar}
              >
                <Text style={{ color: colors.ink, fontWeight: "700" }}>SB</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            contentContainerStyle={{
              padding: desktop ? 36 : 20,
              paddingBottom: 40,
              gap: data.preferences?.compact ? 12 : 24,
              maxWidth: 1350,
              width: "100%",
              alignSelf: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {!desktop && (
              <Text style={[ui.title, { fontSize: 18 }]}>
                Workfolio{" "}
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {" "}
                  / Service business workspace
                </Text>
              </Text>
            )}
            <View
              style={[
                ui.row,
                { justifyContent: "space-between", alignItems: "flex-start" },
              ]}
            >
              <View style={{ gap: 8, flex: 1, minWidth: 220 }}>
                <Text style={styles.eyebrow}>
                  {page === "Overview"
                    ? "A LITTLE MORE ORGANISED, EVERY DAY"
                    : "YOUR BUSINESS, IN ONE PLACE"}
                </Text>
                <Text accessibilityRole="header" style={styles.heading}>
                  {page === "Overview"
                    ? "Good work starts here."
                    : page === "Customers"
                      ? "People behind the projects."
                      : page === "Quotations"
                        ? "From enquiry to opportunity."
                        : page === "Jobs"
                          ? "Keep every job moving."
                          : page}
                </Text>
                <Text style={ui.muted}>
                  {page === "Overview"
                    ? "Your customers, quotations and ongoing work at a glance."
                    : page === "Customers"
                      ? "Keep contact and site details ready for your next job."
                      : page === "Quotations"
                        ? "Build clear quotations for any service you provide."
                        : page === "Jobs"
                          ? "Plan the work, follow progress and keep the details together."
                          : "Your business tools, ready when you need them."}
                </Text>
              </View>
              {["Overview", "Customers", "Jobs", "Quotations"].includes(
                page,
              ) && (
                <Button
                  title={
                    page === "Customers"
                      ? "+ Add customer"
                      : page === "Jobs"
                        ? "+ New job"
                        : "+ New quotation"
                  }
                  onPress={() =>
                    open(
                      page === "Customers"
                        ? "customer"
                        : page === "Jobs"
                          ? "job"
                          : "quote",
                    )
                  }
                />
              )}
            </View>
            <View style={ui.row}>
              <Button
                title={
                  data.business ? "Business profile" : "Register your business"
                }
                secondary
                onPress={() => setWorkspace("business")}
              />
              <Button
                title="Invoices"
                secondary
                onPress={() => setWorkspace("invoices")}
              />
              {data.business && (
                <Text style={ui.label}>{data.business.name}</Text>
              )}
            </View>
            <View style={styles.notice}>
              <Text style={{ fontSize: 13, lineHeight: 20, color: "#586348" }}>
                Private account workspace. Payments are recorded manually; public approvals and automatic collection are not connected.
              </Text>
            </View>
            {!!message && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                onPress={() => setMessage("")}
              >
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ color: colors.green }}
                >
                  {message} ×
                </Text>
              </Pressable>
            )}
            {["Profile", "Settings", "Plans", "Reports"].includes(page) ? (
              <AccountPages
                key={page}
                page={page}
                data={data}
                commit={commit}
                logout={() => void logout()}
              />
            ) : page === "Invoices" ? (
              <InvoiceWorkspace
                data={data}
                commit={commit}
                onClose={() => setPage("Overview")}
              />
            ) : page === "Overview" ? (
              <>
                <View style={styles.stats}>
                  {[
                    {
                      label: "Active jobs",
                      value: String(jobs.length),
                      note: "Work still on your board",
                    },
                    {
                      label: "Quotation drafts",
                      value: String(data.quotes.length),
                      note: "Ready for your next review",
                    },
                    {
                      label: "Draft quotation value",
                      value: money(draftValue),
                      note: "Potential work · not revenue",
                    },
                    {
                      label: "Customers",
                      value: String(data.customers.length),
                      note: "Relationships worth keeping",
                    },
                  ].map((s, i) => (
                    <View
                      key={s.label}
                      style={[
                        styles.stat,
                        { minWidth: desktop ? 180 : 140 },
                        i === 0 && {
                          backgroundColor: colors.ink,
                          borderColor: colors.ink,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: i === 0 ? "#D3E3D8" : colors.muted,
                        }}
                      >
                        {s.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: i === 2 ? 22 : 34,
                          fontWeight: "700",
                          color: i === 0 ? "white" : colors.ink,
                          letterSpacing: -1,
                        }}
                      >
                        {s.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: i === 0 ? "#C1D1C6" : colors.muted,
                        }}
                      >
                        {s.note}
                      </Text>
                    </View>
                  ))}
                </View>
                <View
                  style={[
                    ui.card,
                    {
                      backgroundColor: "#E7EEDB",
                      borderColor: "#D9E4C9",
                      padding: 26,
                    },
                  ]}
                >
                  <Badge text="LESS ADMIN. MORE DOING." />
                  <Text style={[ui.title, { fontSize: 25 }]}>
                    One workflow. Every kind of skilled work.
                  </Text>
                  <Text style={[ui.muted, { maxWidth: 620 }]}>
                    Painting a home, fabricating a gate or cleaning an office?
                    Start with a customer, put the scope into a quotation and
                    organise the job.
                  </Text>
                  <View style={ui.row}>
                    <Button
                      title="Create a quotation"
                      onPress={() => open("quote")}
                    />
                    <Button
                      title="Add your first customer"
                      secondary
                      onPress={() => open("customer")}
                    />
                  </View>
                </View>
                <View style={[ui.row, { justifyContent: "space-between" }]}>
                  <Text style={ui.title}>On the job board</Text>
                  <Button
                    title="View all jobs →"
                    secondary
                    onPress={() => setPage("Jobs")}
                  />
                </View>
                {jobs.length ? (
                  jobs.slice(0, 3).map((j) => (
                    <Pressable
                      key={j.id}
                      accessibilityRole="button"
                      onPress={() => setSelectedJob(j.id)}
                      style={ui.card}
                    >
                      <View
                        style={[ui.row, { justifyContent: "space-between" }]}
                      >
                        <Text
                          style={[ui.label, { fontSize: 17, flexShrink: 1 }]}
                        >
                          {j.title}
                        </Text>
                        <Badge text={j.status} />
                      </View>
                      <Text style={ui.muted}>
                        {customer(j.customerId)?.name} · {j.trade} · {j.due}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={ui.muted}>
                    No active jobs. Add a direct job to get started.
                  </Text>
                )}
              </>
            ) : (
              <>
                <TextInput
                  accessibilityLabel={"Search " + page.toLowerCase()}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={"Search " + page.toLowerCase() + "…"}
                  style={[ui.input, { backgroundColor: "white" }]}
                />
                {page === "Jobs" && (
                  <Chips
                    items={["All", ...jobStatuses]}
                    value={filter}
                    onChange={setFilter}
                  />
                )}
                {page === "Customers" &&
                  data.customers
                    .filter((c) =>
                      matches(c.name + " " + c.phone + " " + c.site),
                    )
                    .map((c) => (
                      <View key={c.id} style={ui.card}>
                        <View style={ui.row}>
                          <View
                            style={[
                              styles.avatar,
                              { backgroundColor: "#EFF3E7" },
                            ]}
                          >
                            <Text
                              style={{ fontWeight: "700", color: colors.green }}
                            >
                              {c.name
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[ui.label, { fontSize: 17 }]}>
                              {c.name}
                            </Text>
                            <Text style={ui.muted}>{c.phone}</Text>
                          </View>
                        </View>
                        <Text style={ui.muted}>
                          {c.site || "No site added"}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.green }}>
                          {
                            data.quotes.filter((q) => q.customerId === c.id)
                              .length
                          }{" "}
                          quotations ·{" "}
                          {
                            data.jobs.filter((j) => j.customerId === c.id)
                              .length
                          }{" "}
                          jobs
                        </Text>
                      </View>
                    ))}
                {page === "Quotations" &&
                  data.quotes
                    .filter((q) =>
                      matches(q.title + " " + customer(q.customerId)?.name),
                    )
                    .map((q) => (
                      <View key={q.id} style={ui.card}>
                        <View
                          style={[ui.row, { justifyContent: "space-between" }]}
                        >
                          <Badge text="Draft" />
                          <Text style={ui.muted}>{q.trade}</Text>
                        </View>
                        <Text style={[ui.title, { fontSize: 19 }]}>
                          {q.title}
                        </Text>
                        <Text style={ui.muted}>
                          {customer(q.customerId)?.name} · {q.lines.length}{" "}
                          items
                        </Text>
                        <View
                          style={[ui.row, { justifyContent: "space-between" }]}
                        >
                          <Text style={[ui.title, { fontSize: 21 }]}>
                            {money(quoteTotals(q.lines, q.discount).total)}
                          </Text>
                          <Button
                            title="Open draft"
                            secondary
                            onPress={() => open("quote", q)}
                          />
                          <Button
                            title={
                              exporting
                                ? "Preparing PDF…"
                                : "Export quotation PDF"
                            }
                            secondary
                            disabled={exporting}
                            onPress={() => setTemplateQuote(q)}
                          />
                        </View>
                      </View>
                    ))}
                {page === "Jobs" &&
                  data.jobs
                    .filter(
                      (j) =>
                        (filter === "All" || j.status === filter) &&
                        matches(
                          j.title +
                            " " +
                            customer(j.customerId)?.name +
                            " " +
                            j.trade,
                        ),
                    )
                    .map((j) => (
                      <Pressable
                        accessibilityRole="button"
                        key={j.id}
                        onPress={() => setSelectedJob(j.id)}
                        style={ui.card}
                      >
                        <View
                          style={[ui.row, { justifyContent: "space-between" }]}
                        >
                          <Badge text={j.status} />
                          <Text style={ui.muted}>{j.due}</Text>
                        </View>
                        <Text style={[ui.title, { fontSize: 19 }]}>
                          {j.title}
                        </Text>
                        <Text style={ui.muted}>
                          {customer(j.customerId)?.name} · {j.trade}
                        </Text>
                        <Text
                          style={{ color: colors.green, fontWeight: "600" }}
                        >
                          Open job →
                        </Text>
                      </Pressable>
                    ))}
                <Text
                  style={[ui.muted, { textAlign: "center", marginTop: 12 }]}
                >
                  Showing matching {page.toLowerCase()}. Use the button above to
                  add a record.
                </Text>
              </>
            )}
            <Text style={{ color: "#849185", fontSize: 12 }}>
              Workfolio / Your service business workspace
            </Text>
          </ScrollView>

        </View>
      </View>
      {templateQuote && <TemplatePicker onClose={() => setTemplateQuote(null)} onExport={templateId => quotationPdf(templateQuote, templateId)} />}
      <Modal visible={menuOpen && !desktop} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setMenuOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.menuHeader}>
            <View style={{ gap: 4, flex: 1 }}><Text style={ui.title}>Workfolio</Text><Text numberOfLines={1} style={ui.muted}>{data.business?.name || 'Your workspace'}</Text></View>
            <Button title="Close" secondary onPress={() => setMenuOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 32 }}>
            <Text style={[styles.eyebrow, { marginBottom: 8 }]}>WORKSPACE</Text>
            {pages.map((p, index) => <React.Fragment key={p}>
              {index === 6 && <Text style={[styles.eyebrow, { marginTop: 20, marginBottom: 8 }]}>ACCOUNT</Text>}
              <Pressable accessibilityRole="button" accessibilityLabel={`Go to ${p}`} accessibilityState={{ selected: page === p }} onPress={() => { setPage(p); setMenuOpen(false); setSearch(''); setFilter('All'); }} style={({ pressed }) => [styles.mobileNavItem, page === p && styles.navActive, pressed && { opacity: 0.65 }]}>
                <Text style={[styles.mobileNavText, page === p && { color: colors.green, fontWeight: '700' }]}>{p}</Text>
                <Text style={{ color: colors.green, fontSize: 14 }}>{page === p ? 'Current' : '\u203a'}</Text>
              </Pressable>
            </React.Fragment>)}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={workspace !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setWorkspace(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 760,
              alignSelf: "center",
            }}
          >
            {workspace === "business" && (
              <BusinessEditor
                business={data.business}
                onSave={async (business) => {
                  await commit({ ...data, business });
                  setWorkspace(null);
                }}
                onCancel={() => setWorkspace(null)}
              />
            )}
            {workspace === "invoices" && (
              <InvoiceWorkspace
                data={data}
                commit={commit}
                onClose={() => setWorkspace(null)}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={editor !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setEditor(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View
            style={{
              width: "100%",
              maxWidth: 760,
              alignSelf: "center",
              flex: 1,
            }}
          >
            {editor && (
              <Editor
                key={editor + (editingQuote?.id ?? "new")}
                kind={editor}
                data={data}
                quote={editingQuote}
                onSave={saveRecord}
                onCancel={() => setEditor(null)}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJob(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          {selected && (
            <ScrollView
              contentContainerStyle={{
                padding: 24,
                gap: 22,
                width: "100%",
                maxWidth: 760,
                alignSelf: "center",
              }}
            >
              <Text style={styles.eyebrow}>JOB DETAILS</Text>
              <Text style={styles.heading}>{selected.title}</Text>
              <Badge text={selected.status} />
              <View style={ui.card}>
                <Text style={ui.label}>
                  {customer(selected.customerId)?.name}
                </Text>
                <Text style={ui.muted}>
                  {customer(selected.customerId)?.phone}
                </Text>
                <Text style={ui.muted}>
                  {customer(selected.customerId)?.site}
                </Text>
                <Text style={ui.muted}>
                  {selected.trade} · Scheduled {selected.due}
                </Text>
              </View>
              <Text style={ui.label}>Progress</Text>
              <Chips
                items={jobStatuses}
                value={selected.status}
                onChange={(s) => updateStatus(s as JobStatus)}
              />
              <Text style={ui.muted}>
                Completed marks operational progress only. It does not settle
                invoices or confirm payment.
              </Text>
              <View style={ui.card}>
                <Text style={ui.label}>Job notes</Text>
                <Text style={ui.muted}>{selected.note || "No notes yet."}</Text>
              </View>
              <Button
                title="Back to workspace"
                secondary
                onPress={() => setSelectedJob(null)}
              />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 16,
  },
  sidebar: {
    width: 236,
    backgroundColor: "#FCFDF9",
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 26,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: colors.muted,
  },
  navItem: {
    padding: 13,
    borderRadius: 10,
    flexDirection: "row",
    minHeight: 46,
  },
  navActive: { backgroundColor: "#E8EFDE" },
  navText: { fontSize: 14, color: colors.muted },
  sideFooter: {
    gap: 14,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 20,
  },
  topbar: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FCFDF9",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2EAD5",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
    color: colors.ink,
  },
  notice: {
    borderRadius: 10,
    padding: 13,
    backgroundColor: "#EFF1E5",
    borderWidth: 1,
    borderColor: "#DFE5D2",
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  stat: {
    flex: 1,
    padding: 21,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  menuButton: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EDF2EB', alignItems: 'center', justifyContent: 'center' },
  menuLine: { width: 20, height: 2, borderRadius: 1, backgroundColor: colors.ink },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  mobileNavItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 15, backgroundColor: colors.white },
  mobileNavText: { fontSize: 17, color: colors.ink },
});
