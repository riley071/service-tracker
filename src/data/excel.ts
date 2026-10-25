import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppData } from '../domain/model';
import { quoteTotals } from '../domain/money';
import { invoiceBalance } from '../domain/payments';

export async function exportExcel(data: AppData) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const sheets = {
    Invoices: (data.invoices ?? []).map(i => { const b = invoiceBalance(data, i); return { Reference: i.number, Customer: i.customer.name, Title: i.title, Issued: i.issuedOn, Due: i.due, Currency: 'MWK', Total: Number(b.total) / 100, Paid: Number(b.paid) / 100, Balance: Number(b.due) / 100 }; }),
    Quotations: data.quotes.map(q => ({ Reference: q.id, Customer: data.customers.find(c => c.id === q.customerId)?.name ?? '', Title: q.title, Status: q.status, Currency: 'MWK', Total: Number(quoteTotals(q.lines, q.discount).total) / 100 })),
    Customers: data.customers.map(c => ({ Name: c.name, Phone: c.phone, Site: c.site })),
    Jobs: data.jobs.map(j => ({ Title: j.title, Customer: data.customers.find(c => c.id === j.customerId)?.name ?? '', Status: j.status, Due: j.due, Trade: j.trade })),
    Payments: (data.payments ?? []).map(p => ({ Invoice: data.invoices?.find(i => i.id === p.invoiceId)?.number ?? p.invoiceId, Date: p.date, Amount: Number(p.amount), Currency: 'MWK', Method: p.method, Reference: p.reference })),
  };
  for (const [name, rows] of Object.entries(sheets)) {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Information: 'No records' }]);
    sheet['!cols'] = Array.from({ length: 10 }, () => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  const bytes: ArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const name = `Workfolio-${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (Platform.OS === 'web') {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device.');
    const file = new File(Paths.cache, name); file.create({ overwrite: true }); file.write(new Uint8Array(bytes));
    await Sharing.shareAsync(file.uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
  }
}
