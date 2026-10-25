import test from 'node:test';
import assert from 'node:assert/strict';
import { issueInvoice, documentHtml } from '../src/domain/documents.ts';
import type { Business, Customer, Quote } from '../src/domain/model.ts';
const business: Business = { name: 'Acme & Sons', owner: 'Owner', address: 'Lilongwe', phone: '+265881234567', email: '', registration: '', terms: 'Due as agreed', paymentDetails: 'Bank transfer' };
const customer: Customer = { id: 'c1', name: '<script>alert(1)</script>', phone: '+265881234567', site: 'Site' };
const quote: Quote = { id: 'q1', title: 'Painting', customerId: 'c1', trade: 'Painting', lines: [{ id: 'l1', description: 'Paint <walls>', quantity: '2', unit: 'job', price: '100' }], discount: '10', createdAt: new Date().toISOString(), status: 'Draft' };
test('invoice preserves issued snapshots and allocates sequential references', () => {
  const invoice = issueInvoice(quote, business, customer, [], '2099-01-01');
  assert.equal(invoice.number, 'INV-00001');
  const next = issueInvoice(quote, business, customer, [invoice], '2099-01-01');
  assert.equal(next.number, 'INV-00002');
  assert.notEqual(invoice.business, business);
  assert.notEqual(invoice.customer, customer);
  assert.notEqual(invoice.lines[0], quote.lines[0]);
});
test('invalid due dates and incomplete business profiles cannot issue invoices', () => {
  for (const date of ['2000-01-01', '2099-02-30', 'invalid']) assert.throws(() => issueInvoice(quote, business, customer, [], date));
  assert.throws(() => issueInvoice(quote, { ...business, name: '' }, customer, [], '2099-01-01'));
});
test('document escapes customer content, rejects unsafe logos, and prints exact totals', () => {
  const invoice = issueInvoice(quote, { ...business, logo: 'javascript:alert(1)' }, customer, [], '2099-01-01');
  const html = documentHtml(invoice, 'Invoice');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('MWK 180.00'));
  assert.ok(html.includes('Bank transfer'));
  assert.ok(documentHtml(invoice, 'Quotation').includes('Payment instructions'));
  assert.ok(!documentHtml(invoice, 'Quotation').includes('Balance due')); 
});


test('invoice export separates invoice value, collections and remaining balance', () => {
  const invoice = issueInvoice(quote, business, customer, [], '2099-01-01');
  const html = documentHtml(invoice, 'Invoice', { paid: 3000n });
  assert.ok(html.includes('MWK 180.00'));
  assert.ok(html.includes('MWK 30.00'));
  assert.ok(html.includes('MWK 150.00'));
  assert.ok(html.includes('Amount received'));
  assert.throws(() => documentHtml(invoice, 'Invoice', { paid: 18001n }));
  assert.throws(() => documentHtml(invoice, 'Invoice', { paid: -1n }));
});
