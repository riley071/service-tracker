import test from 'node:test';
import assert from 'node:assert/strict';
import { documentTemplates, findTemplate, freeTemplateStyles } from '../src/domain/templates.ts';
import { documentHtml } from '../src/domain/documents.ts';
import type { Business, Customer } from '../src/domain/model.ts';

test('catalogue contains exactly 3 free and 10 paid templates without bundled paid styles', () => {
  assert.equal(documentTemplates.filter(t => !t.premium).length, 3);
  assert.equal(documentTemplates.filter(t => t.premium).length, 10);
  assert.equal(new Set(documentTemplates.map(t => t.id)).size, 13);
  assert.deepEqual(Object.keys(freeTemplateStyles).sort(), ['classic', 'ledger', 'minimal']);
  for (const t of documentTemplates.filter(t => t.premium)) assert.equal(freeTemplateStyles[t.id], undefined);
  assert.throws(() => findTemplate('unknown'));
});

test('each free layout preserves the exact document value and escaped content', () => {
  const doc = { title: 'Paint <walls>', number: 'INV-00001', issuedOn: '2026-10-25', discount: '10', lines: [{ id: 'l', description: 'Labour', quantity: '2', price: '100', unit: 'day' }], business: { name: 'Business', address: 'Lilongwe', phone: '0990000000', owner: 'Owner', email: '', registration: '', terms: '', paymentDetails: '' } as Business, customer: { id: 'c', name: 'Customer', phone: '0880000000', site: 'Site' } as Customer };
  const output = Object.values(freeTemplateStyles).map(templateCss => documentHtml(doc, 'Invoice', { templateCss, paid: 3000n }));
  assert.equal(new Set(output).size, 3);
  for (const html of output) { assert.ok(html.includes('MWK 180.00')); assert.ok(html.includes('MWK 150.00')); assert.ok(html.includes('Paint &lt;walls&gt;')); }
});
