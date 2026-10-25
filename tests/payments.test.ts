import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceBalance, paymentCents } from '../src/domain/payments.ts';
import type { AppData, Invoice } from '../src/domain/model.ts';

test('partial collections reconcile exactly without changing issued value', () => {
  const invoice = { id: 'i1', lines: [{ id: 'l1', description: 'Labour', quantity: '1', unit: 'job', price: '100000' }], discount: '0' } as Invoice;
  const data = { version: 1, customers: [], quotes: [], jobs: [], invoices: [invoice], payments: [ { id: 'p1', invoiceId: 'i1', amount: '30000', date: '2026-10-24', method: 'Cash', reference: '' }, { id: 'p2', invoiceId: 'other', amount: '500', date: '2026-10-24', method: 'Cash', reference: '' } ] } as AppData;
  assert.deepEqual(invoiceBalance(data, invoice), { total: 10000000n, paid: 3000000n, due: 7000000n });
});
test('payments reject zero, negative, malformed and excessive precision', () => {
  for (const amount of ['0', '-1', '1.001', 'NaN', '1e5', '']) assert.throws(() => paymentCents(amount));
  assert.equal(paymentCents('0.01'), 1n);
  assert.equal(paymentCents('2000.50'), 200050n);
});
