import { mkdirSync, writeFileSync } from 'node:fs';
import { documentHtml } from '../src/domain/documents.ts';
mkdirSync('tmp/documents', { recursive: true });
writeFileSync('tmp/documents/invoice.html', documentHtml({
  title: 'Interior painting and preparation', number: 'INV-00001', issuedOn: '2026-10-19', due: '2026-11-02', discount: '10',
  business: { name: 'Lilongwe Services', owner: 'Business Owner', address: 'Area 43\nLilongwe, Malawi', phone: '+265881234567', email: 'office@example.com', registration: 'DEMO-1234', paymentDetails: 'Bank: Example Bank\nAccount: 0000000000', terms: 'Payment due within 14 days. Please include the invoice number as your reference.' },
  customer: { id: 'demo', name: 'Demo Customer', phone: '+265991234567', site: 'Area 12, Lilongwe' },
  lines: [{ id: '1', description: 'Wall preparation, filling and sanding', quantity: '2', unit: 'rooms', price: '25000' }, { id: '2', description: 'Two coats of interior paint including labour', quantity: '2', unit: 'rooms', price: '40000' }],
}, 'Invoice'));
