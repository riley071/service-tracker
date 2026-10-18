export type Trade = 'Painting' | 'Construction' | 'Cleaning' | 'Welding' | 'Electrical' | 'Plumbing' | 'Carpentry' | 'Other';
export const trades: Trade[] = ['Painting','Construction','Cleaning','Welding','Electrical','Plumbing','Carpentry','Other'];
export type Customer = { id: string; name: string; phone: string; site: string };
export type QuoteLine = { id: string; description: string; quantity: string; unit: string; price: string };
export type Quote = { id: string; customerId: string; title: string; trade: Trade; lines: QuoteLine[]; discount: string; createdAt: string; status: 'Draft' };
export type JobStatus = 'Scheduled' | 'In progress' | 'On hold' | 'Completed';
export const jobStatuses: JobStatus[] = ['Scheduled','In progress','On hold','Completed'];
export type Job = { id: string; customerId: string; title: string; trade: Trade; due: string; status: JobStatus; note: string };
export type AppData = { version: 1; customers: Customer[]; quotes: Quote[]; jobs: Job[] };
export function id() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
export function normalisePhone(raw: string): string {
  const phone = raw.replace(/[\s()-]/g, '');
  if (/^0[189]\d{8}$/.test(phone)) return '+265' + phone.slice(1);
  if (/^265[189]\d{8}$/.test(phone)) return '+' + phone;
  if (/^\+[1-9]\d{7,14}$/.test(phone)) return phone;
  throw new Error('Enter a valid phone number, for example 0881 234 567 or +265881234567.');
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
