import React, { useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import type { AppData, Lead, Project, Task } from "../domain/model";
import { id, validDate } from "../domain/model";
import { focusTasks, localDay, taskReport } from "../domain/tasks";
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

export function TaskSummary({ data }: { data: AppData }) {
  const report = taskReport(data.tasks ?? []);
  return (
    <View style={ui.card}>
      <Text style={ui.title}>Your work at a glance</Text>
      <View style={ui.row}>
        <Badge text={`${report.today} due today`} tone="info" />
        <Badge
          text={`${report.overdue} overdue`}
          tone={report.overdue ? "danger" : "neutral"}
        />
        <Badge text={`${report.open} open`} tone="neutral" />
      </View>
      <Text style={ui.label}>
        {report.done} of {report.total} tasks completed ({report.rate}%)
      </Text>
    </View>
  );
}

/** Local-time YYYY-MM-DD, offset from a given day. */
function shiftDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function DatePresets({
  value,
  onChange,
}: {
  value: string;
  onChange: (day: string) => void;
}) {
  const today = localDay();
  const options: Record<string, string> = {
    Today: today,
    Tomorrow: shiftDay(today, 1),
    "Next week": shiftDay(today, 7),
    "No date": "",
  };
  const current = Object.keys(options).find((k) => options[k] === value) ?? "";
  return (
    <Chips
      items={Object.keys(options)}
      value={current}
      onChange={(k) => onChange(options[k])}
    />
  );
}

/** Makes duplicate titles distinguishable so chip labels map to one record. */
function uniqueLabels(items: { id: string; title: string }[]) {
  const seen: Record<string, number> = {};
  return items.map((item) => {
    const base = item.title || "Untitled";
    seen[base] = (seen[base] ?? 0) + 1;
    return {
      id: item.id,
      label: seen[base] > 1 ? `${base} (${seen[base]})` : base,
    };
  });
}

const priorityRank = { High: 0, Normal: 1, Low: 2 } as const;

function ConfirmDelete({
  label,
  busy,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed)
    return (
      <Button
        title={label}
        variant="danger"
        disabled={busy}
        onPress={() => setArmed(true)}
      />
    );
  return (
    <View style={ui.row}>
      <Text style={ui.label}>Delete permanently?</Text>
      <Button
        title="Yes, delete"
        variant="danger"
        disabled={busy}
        onPress={onConfirm}
      />
      <Button title="Keep" secondary onPress={() => setArmed(false)} />
    </View>
  );
}

export function WorkManagement({
  page,
  data,
  commit,
}: {
  page: string;
  data: AppData;
  commit: (data: AppData) => Promise<void>;
}) {
  const tasks = data.tasks ?? [];
  const projects = data.projects ?? [];
  const leads = data.leads ?? [];
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  async function save(next: AppData) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await commit(next);
      setTask(null);
      setProject(null);
      setLead(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function check(title: string, date: string) {
    if (!title.trim()) {
      setError("Add a name or title.");
      return false;
    }
    if (date && !validDate(date)) {
      setError("Use a valid date in YYYY-MM-DD format, or leave it blank.");
      return false;
    }
    return true;
  }

  function newTask(projectId = "", leadId = "", title = "") {
    setError("");
    setTask({
      id: id(),
      title,
      note: "",
      due: localDay(),
      priority: "Normal",
      status: "To do",
      projectId,
      leadId,
      createdAt: new Date().toISOString(),
    });
  }

  function closeForms() {
    setTask(null);
    setProject(null);
    setLead(null);
    setError("");
  }

  const today = localDay();
  const projectLabels = useMemo(() => uniqueLabels(projects), [projects]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      filter === "Today"
        ? focusTasks(tasks)
        : tasks.filter((t) => filter === "All" || t.status === filter);
    const filtered = base.filter((t) =>
      `${t.title} ${t.note} ${projects.find((p) => p.id === t.projectId)?.title ?? ""}`
        .toLowerCase()
        .includes(q),
    );
    if (filter === "Today") return filtered;
    // Open work first (soonest due, then priority), finished work last.
    return [...filtered].sort((a, b) => {
      const doneDiff =
        Number(a.status === "Done") - Number(b.status === "Done");
      if (doneDiff) return doneDiff;
      const dueA = a.due || "9999-12-31";
      const dueB = b.due || "9999-12-31";
      if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }, [tasks, projects, filter, search]);

  const editing = task ?? project ?? lead;

  return (
    <View style={{ gap: 18 }}>
      <SectionHeader title={page} />
      {!!error && (
        <Banner tone="danger" text={error} onDismiss={() => setError("")} />
      )}

      {task ? (
        <View style={ui.card}>
          <Text style={ui.title}>
            {tasks.some((t) => t.id === task.id) ? "Edit task" : "New task"}
          </Text>
          <Field
            label="Task title"
            value={task.title}
            onChangeText={(title) => setTask({ ...task, title })}
          />
          <Field
            label="Notes / checklist"
            multiline
            value={task.note}
            onChangeText={(note) => setTask({ ...task, note })}
          />
          <Text style={ui.label}>Due</Text>
          <DatePresets
            value={task.due}
            onChange={(due) => setTask({ ...task, due })}
          />
          <Field
            label="Or type a date (YYYY-MM-DD)"
            value={task.due}
            onChangeText={(due) => setTask({ ...task, due })}
          />
          <Text style={ui.label}>Priority</Text>
          <Chips
            items={["Low", "Normal", "High"]}
            value={task.priority}
            onChange={(priority) =>
              setTask({ ...task, priority: priority as Task["priority"] })
            }
          />
          <Text style={ui.label}>Status</Text>
          <Chips
            items={["To do", "In progress", "Done"]}
            value={task.status}
            onChange={(status) =>
              setTask({
                ...task,
                status: status as Task["status"],
                completedAt:
                  status === "Done"
                    ? (task.completedAt ?? new Date().toISOString())
                    : undefined,
              })
            }
          />
          {!!projects.length && (
            <>
              <Text style={ui.label}>Project</Text>
              <Chips
                items={["No project", ...projectLabels.map((p) => p.label)]}
                value={
                  projectLabels.find((p) => p.id === task.projectId)?.label ??
                  "No project"
                }
                onChange={(label) =>
                  setTask({
                    ...task,
                    projectId:
                      projectLabels.find((p) => p.label === label)?.id ?? "",
                  })
                }
              />
            </>
          )}
          <View style={ui.row}>
            <Button
              title="Save task"
              loading={busy}
              onPress={() => {
                if (check(task.title, task.due))
                  void save({
                    ...data,
                    tasks: [
                      { ...task, title: task.title.trim() },
                      ...tasks.filter((t) => t.id !== task.id),
                    ],
                  });
              }}
            />
            <Button
              title="Cancel"
              secondary
              disabled={busy}
              onPress={closeForms}
            />
          </View>
          {tasks.some((t) => t.id === task.id) && (
            <ConfirmDelete
              label="Delete task"
              busy={busy}
              onConfirm={() =>
                void save({
                  ...data,
                  tasks: tasks.filter((t) => t.id !== task.id),
                })
              }
            />
          )}
        </View>
      ) : project ? (
        <View style={ui.card}>
          <Text style={ui.title}>
            {projects.some((p) => p.id === project.id)
              ? "Edit project"
              : "New project"}
          </Text>
          <Field
            label="Project name"
            value={project.title}
            onChangeText={(title) => setProject({ ...project, title })}
          />
          <Field
            label="Project brief"
            multiline
            value={project.note}
            onChangeText={(note) => setProject({ ...project, note })}
          />
          <Text style={ui.label}>Target date</Text>
          <DatePresets
            value={project.due}
            onChange={(due) => setProject({ ...project, due })}
          />
          <Field
            label="Or type a date (YYYY-MM-DD)"
            value={project.due}
            onChangeText={(due) => setProject({ ...project, due })}
          />
          <View style={ui.row}>
            <Button
              title="Save project"
              loading={busy}
              onPress={() => {
                if (check(project.title, project.due))
                  void save({
                    ...data,
                    projects: [
                      { ...project, title: project.title.trim() },
                      ...projects.filter((p) => p.id !== project.id),
                    ],
                  });
              }}
            />
            <Button
              title="Cancel"
              secondary
              disabled={busy}
              onPress={closeForms}
            />
          </View>
          {projects.some((p) => p.id === project.id) && (
            <ConfirmDelete
              label="Delete project"
              busy={busy}
              onConfirm={() =>
                void save({
                  ...data,
                  projects: projects.filter((p) => p.id !== project.id),
                  // Keep the tasks, just detach them from the removed project.
                  tasks: tasks.map((t) =>
                    t.projectId === project.id ? { ...t, projectId: "" } : t,
                  ),
                })
              }
            />
          )}
        </View>
      ) : lead ? (
        <View style={ui.card}>
          <Text style={ui.title}>
            {leads.some((l) => l.id === lead.id) ? "Edit lead" : "New lead"}
          </Text>
          <Field
            label="Company / lead name"
            value={lead.company}
            onChangeText={(company) => setLead({ ...lead, company })}
          />
          <Field
            label="Contact email (optional)"
            value={lead.email}
            onChangeText={(email) => setLead({ ...lead, email })}
          />
          <Field
            label="Opportunity / contact notes"
            multiline
            value={lead.note}
            onChangeText={(note) => setLead({ ...lead, note })}
          />
          <Text style={ui.label}>Follow-up date</Text>
          <DatePresets
            value={lead.followUp}
            onChange={(followUp) => setLead({ ...lead, followUp })}
          />
          <Field
            label="Or type a date (YYYY-MM-DD)"
            value={lead.followUp}
            onChangeText={(followUp) => setLead({ ...lead, followUp })}
          />
          <Text style={ui.label}>Stage</Text>
          <Chips
            items={["New", "Contacted", "Proposal sent", "Won", "Lost"]}
            value={lead.stage}
            onChange={(stage) =>
              setLead({ ...lead, stage: stage as Lead["stage"] })
            }
          />
          <View style={ui.row}>
            <Button
              title="Save lead"
              loading={busy}
              onPress={() => {
                if (check(lead.company, lead.followUp))
                  void save({
                    ...data,
                    leads: [
                      { ...lead, company: lead.company.trim() },
                      ...leads.filter((l) => l.id !== lead.id),
                    ],
                  });
              }}
            />
            <Button
              title="Cancel"
              secondary
              disabled={busy}
              onPress={closeForms}
            />
          </View>
          {leads.some((l) => l.id === lead.id) && (
            <ConfirmDelete
              label="Delete lead"
              busy={busy}
              onConfirm={() =>
                void save({
                  ...data,
                  leads: leads.filter((l) => l.id !== lead.id),
                  tasks: tasks.map((t) =>
                    t.leadId === lead.id ? { ...t, leadId: "" } : t,
                  ),
                })
              }
            />
          )}
        </View>
      ) : null}

      {!editing && page === "Tasks" && (
        <>
          <TaskSummary data={data} />
          <Button title="+ Add task" onPress={() => newTask()} />
          <Field label="Search tasks" value={search} onChangeText={setSearch} />
          <Chips
            items={["All", "Today", "To do", "In progress", "Done"]}
            value={filter}
            onChange={setFilter}
          />
          {filter === "Today" && (
            <Text style={ui.muted}>
              Due today and overdue, with oldest deadlines first.
            </Text>
          )}
          {visible.map((t) => {
            const overdue = t.status !== "Done" && !!t.due && t.due < today;
            const projectTitle = projects.find(
              (p) => p.id === t.projectId,
            )?.title;
            const leadName = leads.find((l) => l.id === t.leadId)?.company;
            return (
              <View
                key={t.id}
                style={[ui.card, t.status === "Done" && { opacity: 0.7 }]}
              >
                <View style={ui.row}>
                  <Badge
                    text={t.status}
                    tone={t.status === "Done" ? "neutral" : "green"}
                  />
                  <Badge
                    text={t.priority}
                    tone={t.priority === "High" ? "warn" : "neutral"}
                  />
                  {overdue && <Badge text="Overdue" tone="danger" />}
                </View>
                <Text
                  style={[
                    ui.title,
                    t.status === "Done" && {
                      textDecorationLine: "line-through",
                    },
                  ]}
                >
                  {t.title}
                </Text>
                <Text style={ui.muted}>
                  {t.due ? `Due ${t.due}` : "No deadline"}
                </Text>
                {!!t.note && <Text style={ui.muted}>{t.note}</Text>}
                {!!projectTitle && (
                  <Text style={ui.label}>Project: {projectTitle}</Text>
                )}
                {!!leadName && <Text style={ui.label}>Lead: {leadName}</Text>}
                <View style={ui.row}>
                  <Button
                    title={
                      t.status === "Done" ? "Reopen task" : "Mark complete"
                    }
                    disabled={busy}
                    onPress={() =>
                      void save({
                        ...data,
                        tasks: tasks.map((item) =>
                          item.id === t.id
                            ? {
                                ...item,
                                status: t.status === "Done" ? "To do" : "Done",
                                completedAt:
                                  t.status === "Done"
                                    ? undefined
                                    : new Date().toISOString(),
                              }
                            : item,
                        ),
                      })
                    }
                  />
                  <Button
                    title="Edit task"
                    secondary
                    disabled={busy}
                    onPress={() => {
                      setError("");
                      setTask(t);
                    }}
                  />
                </View>
              </View>
            );
          })}
          {!visible.length && (
            <EmptyState
              title={tasks.length ? "No tasks in this view" : "No tasks yet"}
              body="Add your next action, such as updating your website or sending a proposal."
              action={<Button title="+ Add task" onPress={() => newTask()} />}
            />
          )}
        </>
      )}

      {!editing && page === "Projects" && (
        <>
          <Text style={ui.muted}>
            Break a project into dated tasks and track its progress.
          </Text>
          <Button
            title="+ Create project"
            onPress={() => {
              setError("");
              setProject({ id: id(), title: "", note: "", due: "" });
            }}
          />
          {projects.map((p) => {
            const linked = tasks.filter((t) => t.projectId === p.id);
            const r = taskReport(linked);
            return (
              <View key={p.id} style={ui.card}>
                <Text style={ui.title}>{p.title}</Text>
                {!!p.note && <Text style={ui.muted}>{p.note}</Text>}
                <View style={ui.row}>
                  {!!p.due && <Badge text={`Target ${p.due}`} tone="info" />}
                  <Badge text={`${r.done}/${r.total} complete`} />
                  {r.overdue > 0 && (
                    <Badge text={`${r.overdue} overdue`} tone="danger" />
                  )}
                </View>
                {linked.map((t) => (
                  <Text key={t.id} style={ui.muted}>
                    {t.status === "Done" ? "✓" : "○"} {t.title}
                    {t.due ? ` · ${t.due}` : ""}
                  </Text>
                ))}
                <View style={ui.row}>
                  <Button
                    title="Add project task"
                    onPress={() => newTask(p.id)}
                  />
                  <Button
                    title="Edit project"
                    secondary
                    onPress={() => {
                      setError("");
                      setProject(p);
                    }}
                  />
                </View>
              </View>
            );
          })}
          {!projects.length && (
            <EmptyState
              title="No projects yet"
              body="Create your first project, then add milestones as tasks."
            />
          )}
        </>
      )}

      {!editing && page === "Leads" && (
        <>
          <Text style={ui.muted}>
            Keep companies you want to approach in one place, from first contact
            to a won opportunity.
          </Text>
          <Button
            title="+ Add lead"
            onPress={() => {
              setError("");
              setLead({
                id: id(),
                company: "",
                email: "",
                note: "",
                followUp: "",
                stage: "New",
              });
            }}
          />
          {leads.map((l) => {
            const closed = ["Won", "Lost"].includes(l.stage);
            const due = !!l.followUp && l.followUp <= today && !closed;
            return (
              <View key={l.id} style={ui.card}>
                <View style={ui.row}>
                  <Badge
                    text={l.stage}
                    tone={
                      l.stage === "Won"
                        ? "green"
                        : l.stage === "Lost"
                          ? "neutral"
                          : "info"
                    }
                  />
                  {due && <Badge text="Follow-up due" tone="warn" />}
                </View>
                <Text style={ui.title}>{l.company}</Text>
                {!!l.email && <Text style={ui.muted}>{l.email}</Text>}
                {!!l.note && <Text style={ui.muted}>{l.note}</Text>}
                {!!l.followUp && (
                  <Text style={ui.label}>Follow up {l.followUp}</Text>
                )}
                <View style={ui.row}>
                  <Button
                    title="Create proposal task"
                    onPress={() =>
                      newTask("", l.id, `Send proposal to ${l.company}`)
                    }
                  />
                  <Button
                    title="Edit lead"
                    secondary
                    onPress={() => {
                      setError("");
                      setLead(l);
                    }}
                  />
                </View>
              </View>
            );
          })}
          {!leads.length && (
            <EmptyState
              title="No leads yet"
              body="Found a company you could help? Save it here and set a follow-up date."
            />
          )}
        </>
      )}
    </View>
  );
}
