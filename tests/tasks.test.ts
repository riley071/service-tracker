import assert from 'node:assert/strict';
import test from 'node:test';
import { focusTasks, localDay, taskReport } from '../src/domain/tasks.ts';
const task = (id: string, due: string, status: 'To do' | 'Done' = 'To do', priority: 'High' | 'Normal' = 'Normal') => ({ id, title: id, due, status, priority, note: '', projectId: '', leadId: '', createdAt: '' });
test('task reports distinguish overdue, today, undated and completed work', () => {
 const tasks = [task('old', '2026-11-01'), task('today', '2026-11-03'), task('done', '2026-11-01', 'Done'), task('undated', '')];
 assert.deepEqual(taskReport(tasks, '2026-11-03'), { total: 4, done: 1, open: 3, overdue: 1, today: 1, rate: 25 });
 assert.deepEqual(taskReport([], '2026-11-03'), { total: 0, done: 0, open: 0, overdue: 0, today: 0, rate: 0 });
});
test('daily focus excludes future and done tasks, orders by deadline then priority', () => {
 const tasks = [task('normal', '2026-11-03'), task('high', '2026-11-03', 'To do', 'High'), task('old', '2026-11-01'), task('future', '2026-11-04'), task('done', '2026-11-01', 'Done')];
 assert.deepEqual(focusTasks(tasks, '2026-11-03').map(t => t.id), ['old', 'high', 'normal']);
 assert.equal(tasks[0].id, 'normal');
});
test('local day uses the device calendar', () => assert.equal(localDay(new Date(2026, 10, 3, 23, 30)), '2026-11-03'));
