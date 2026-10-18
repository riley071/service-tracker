import type { QuoteLine } from './model.ts';
// Exact decimal parsing and half-up arithmetic; never multiply binary decimal money.
function scaled(value: string, places: number): bigint {
  if (!new RegExp(`^\\d{1,9}(?:\\.\\d{1,${places}})?$`).test(value.trim())) throw new Error(`Use a positive number with at most ${places} decimal places.`);
  const [whole, fraction = ''] = value.trim().split('.');
  return BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places,'0'));
}
export function lineTotal(line: QuoteLine): bigint {
  const quantity = scaled(line.quantity,3);
  if (quantity === 0n) throw new Error('Quantity must be greater than zero.');
  return (quantity * scaled(line.price,2) + 500n) / 1000n;
}
export function quoteTotals(lines: QuoteLine[], discount: string) {
  if (!lines.length) throw new Error('Add at least one quotation item.');
  if (lines.some(line => !line.description.trim())) throw new Error('Give every quotation item a description.');
  const subtotal = lines.reduce((sum,line) => sum + lineTotal(line),0n);
  const percent = scaled(discount || '0',2);
  if (percent > 10000n) throw new Error('Discount must be between 0 and 100%.');
  const reduction = (subtotal * percent + 5000n) / 10000n;
  return { subtotal, discount: reduction, total: subtotal - reduction };
}
export function money(cents: bigint): string {
  const whole = cents / 100n;
  return 'MWK ' + whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',') + '.' + (cents % 100n).toString().padStart(2,'0');
}
