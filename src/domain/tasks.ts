import type { Task } from './model';

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function taskReport(tasks: Task[], today = localDay()) {
  const open = tasks.filter(t => t.status !== 'Done');
  const done = tasks.length - open.length;
  return { total: tasks.length, done, open: open.length, overdue: open.filter(t => t.due && t.due < today).length, today: open.filter(t => t.due === today).length, rate: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
}
export function focusTasks(tasks: Task[], today = localDay()) {
  const priority = { High: 0, Normal: 1, Low: 2 };
  return tasks.filter(t => t.status !== 'Done' && t.due && t.due <= today).sort((a, b) => a.due.localeCompare(b.due) || priority[a.priority] - priority[b.priority]);
}
