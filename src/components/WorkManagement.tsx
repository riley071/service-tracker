import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { AppData, Lead, Project, Task } from '../domain/model';
import { id, validDate } from '../domain/model';
import { focusTasks, localDay, taskReport } from '../domain/tasks';
import { Badge, Button, Chips, Field, ui } from './ui';

export function TaskSummary({ data }: { data: AppData }) {
  const report = taskReport(data.tasks ?? []);
  return <View style={ui.card}><Text style={ui.title}>Your work at a glance</Text><Text style={ui.muted}>{report.today} due today · {report.overdue} overdue · {report.open} open</Text><Text style={ui.label}>{report.done} of {report.total} tasks completed ({report.rate}%)</Text></View>;
}

export function WorkManagement({ page, data, commit }: { page: string; data: AppData; commit: (data: AppData) => Promise<void> }) {
  const tasks = data.tasks ?? [], projects = data.projects ?? [], leads = data.leads ?? [];
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save(next: AppData) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await commit(next); setTask(null); setProject(null); setLead(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function check(title: string, date: string) {
    if (!title.trim()) { setError('Add a name or title.'); return false; }
    if (date && !validDate(date)) { setError('Use a valid date in YYYY-MM-DD format, or leave it blank.'); return false; }
    return true;
  }
  function newTask(projectId = '', leadId = '', title = '') {
    setTask({ id: id(), title, note: '', due: localDay(), priority: 'Normal', status: 'To do', projectId, leadId, createdAt: new Date().toISOString() });
  }
  const visible = (filter === 'Today' ? focusTasks(tasks) : tasks.filter(t => filter === 'All' || t.status === filter)).filter(t => `${t.title} ${t.note} ${projects.find(p => p.id === t.projectId)?.title ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <View style={{ gap: 18 }}>
    <Text style={ui.title}>{page}</Text>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#A33124' }}>{error}</Text>}
    {task ? <View style={ui.card}>
      <Text style={ui.title}>{tasks.some(t => t.id === task.id) ? 'Edit task' : 'New task'}</Text>
      <Field label="Task title" value={task.title} onChangeText={title => setTask({ ...task, title })} />
      <Field label="Notes / checklist" multiline value={task.note} onChangeText={note => setTask({ ...task, note })} />
      <Field label="Due date (YYYY-MM-DD, optional)" value={task.due} onChangeText={due => setTask({ ...task, due })} />
      <Text style={ui.label}>Priority</Text><Chips items={['Low', 'Normal', 'High']} value={task.priority} onChange={priority => setTask({ ...task, priority: priority as Task['priority'] })} />
      <Text style={ui.label}>Status</Text><Chips items={['To do', 'In progress', 'Done']} value={task.status} onChange={status => setTask({ ...task, status: status as Task['status'], completedAt: status === 'Done' ? task.completedAt ?? new Date().toISOString() : undefined })} />
      <Text style={ui.label}>Project</Text><Button title="No project" secondary onPress={() => setTask({ ...task, projectId: '' })} />
      {projects.map(p => <Button key={p.id} title={`${task.projectId === p.id ? 'Selected: ' : ''}${p.title}`} secondary onPress={() => setTask({ ...task, projectId: p.id })} />)}
      <Button title="Save task" disabled={busy} onPress={() => { if (check(task.title, task.due)) void save({ ...data, tasks: [ { ...task, title: task.title.trim() }, ...tasks.filter(t => t.id !== task.id)] }); }} />
      <Button title="Cancel" secondary disabled={busy} onPress={() => { setTask(null); setError(''); }} />
    </View> : project ? <View style={ui.card}>
      <Field label="Project name" value={project.title} onChangeText={title => setProject({ ...project, title })} />
      <Field label="Project brief" multiline value={project.note} onChangeText={note => setProject({ ...project, note })} />
      <Field label="Target date (YYYY-MM-DD, optional)" value={project.due} onChangeText={due => setProject({ ...project, due })} />
      <Button title="Save project" disabled={busy} onPress={() => { if (check(project.title, project.due)) void save({ ...data, projects: [{ ...project, title: project.title.trim() }, ...projects.filter(p => p.id !== project.id)] }); }} />
      <Button title="Cancel" secondary disabled={busy} onPress={() => { setProject(null); setError(''); }} />
    </View> : lead ? <View style={ui.card}>
      <Field label="Company / lead name" value={lead.company} onChangeText={company => setLead({ ...lead, company })} />
      <Field label="Contact email (optional)" value={lead.email} onChangeText={email => setLead({ ...lead, email })} />
      <Field label="Opportunity / contact notes" multiline value={lead.note} onChangeText={note => setLead({ ...lead, note })} />
      <Field label="Follow-up date (YYYY-MM-DD, optional)" value={lead.followUp} onChangeText={followUp => setLead({ ...lead, followUp })} />
      <Chips items={['New', 'Contacted', 'Proposal sent', 'Won', 'Lost']} value={lead.stage} onChange={stage => setLead({ ...lead, stage: stage as Lead['stage'] })} />
      <Button title="Save lead" disabled={busy} onPress={() => { if (check(lead.company, lead.followUp)) void save({ ...data, leads: [{ ...lead, company: lead.company.trim() }, ...leads.filter(l => l.id !== lead.id)] }); }} />
      <Button title="Cancel" secondary disabled={busy} onPress={() => { setLead(null); setError(''); }} />
    </View> : <>
      {page === 'Tasks' && <>
        <TaskSummary data={data} /><Button title="Add task" onPress={() => newTask()} />
        <Field label="Search tasks" value={search} onChangeText={setSearch} />
        <Chips items={['All', 'Today', 'To do', 'In progress', 'Done']} value={filter} onChange={setFilter} />
        {filter === 'Today' && <Text style={ui.muted}>Due today and overdue, with oldest deadlines first.</Text>}
        {visible.map(t => <View key={t.id} style={ui.card}><Badge text={`${t.status} · ${t.priority}`} /><Text style={ui.title}>{t.title}</Text><Text style={ui.muted}>{t.due ? `Due ${t.due}${t.status !== 'Done' && t.due < localDay() ? ' · Overdue' : ''}` : 'No deadline'}</Text>{!!t.note && <Text style={ui.muted}>{t.note}</Text>}{!!t.projectId && <Text style={ui.label}>{projects.find(p => p.id === t.projectId)?.title}</Text>}{!!t.leadId && <Text style={ui.label}>Lead: {leads.find(l => l.id === t.leadId)?.company}</Text>}<Button title="Edit task" secondary disabled={busy} onPress={() => setTask(t)} /><Button title={t.status === 'Done' ? 'Reopen task' : 'Mark complete'} disabled={busy} onPress={() => void save({ ...data, tasks: tasks.map(item => item.id === t.id ? { ...item, status: t.status === 'Done' ? 'To do' : 'Done', completedAt: t.status === 'Done' ? undefined : new Date().toISOString() } : item) })} /></View>)}
        {!visible.length && <Text style={ui.muted}>No tasks in this view. Add your next action, such as updating your website or sending a proposal.</Text>}
      </>}
      {page === 'Projects' && <>
        <Text style={ui.muted}>Break a project into dated tasks and track its progress.</Text><Button title="Create project" onPress={() => setProject({ id: id(), title: '', note: '', due: '' })} />
        {projects.map(p => { const linked = tasks.filter(t => t.projectId === p.id); const r = taskReport(linked); return <View key={p.id} style={ui.card}><Text style={ui.title}>{p.title}</Text><Text style={ui.muted}>{p.note}</Text><Text style={ui.label}>{p.due ? `Target ${p.due} · ` : ''}{r.done}/{r.total} complete · {r.overdue} overdue</Text>{linked.map(t => <Text key={t.id} style={ui.muted}>{t.status === 'Done' ? '✓' : '○'} {t.title}{t.due ? ` · ${t.due}` : ''}</Text>)}<Button title="Add project task" onPress={() => newTask(p.id)} /><Button title="Edit project" secondary onPress={() => setProject(p)} /></View>; })}
        {!projects.length && <Text style={ui.muted}>Create your first project, then add milestones as tasks.</Text>}
      </>}
      {page === 'Leads' && <>
        <Text style={ui.muted}>Keep companies you want to approach in one place, from first contact to a won opportunity.</Text><Button title="Add lead" onPress={() => setLead({ id: id(), company: '', email: '', note: '', followUp: '', stage: 'New' })} />
        {leads.map(l => <View key={l.id} style={ui.card}><Badge text={l.stage} /><Text style={ui.title}>{l.company}</Text><Text style={ui.muted}>{l.email}</Text><Text style={ui.muted}>{l.note}</Text>{!!l.followUp && <Text style={ui.label}>Follow up {l.followUp}{l.followUp <= localDay() && !['Won', 'Lost'].includes(l.stage) ? ' · Due' : ''}</Text>}<Button title="Edit lead" secondary onPress={() => setLead(l)} /><Button title="Create proposal task" onPress={() => newTask('', l.id, `Send proposal to ${l.company}`)} /></View>)}
        {!leads.length && <Text style={ui.muted}>Found a company you could help? Save it here and set a follow-up date.</Text>}
      </>}
    </>}
  </View>;
}
