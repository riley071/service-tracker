import type { AppData, Invoice } from './model.ts';
import { quoteTotals } from './money.ts';
export function paymentCents(value: string) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) throw new Error('Enter a valid amount with up to two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents <= 0n) throw new Error('Payment must be greater than zero.');
  return cents;
}
export function invoiceBalance(data: AppData, invoice: Invoice) {
  const total = quoteTotals(invoice.lines, invoice.discount).total;
  const paid = (data.payments ?? []).filter(p => p.invoiceId === invoice.id).reduce((sum, p) => sum + paymentCents(p.amount), 0n);
  return { total, paid, due: total - paid };
}
