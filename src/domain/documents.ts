import { id, validDate } from './model.ts';
import type { Business, Customer, Invoice, Quote } from './model.ts';
import { lineTotal, money, quoteTotals } from './money.ts';

export function issueInvoice(quote: Quote, business: Business, customer: Customer, existing: Invoice[], due: string): Invoice {
  if (!business.name.trim() || !business.owner.trim() || !business.address.trim() || !business.phone.trim()) throw new Error('Complete your business profile before issuing documents.');
  const issuedOn = new Date().toISOString().slice(0, 10);
  if (!validDate(due) || due < issuedOn) throw new Error('Enter a due date today or later (YYYY-MM-DD).');
  quoteTotals(quote.lines, quote.discount);
  const max = existing.reduce((n, i) => Math.max(n, Number(i.number.replace('INV-', '')) || 0), 0);
  return { id: id(), number: `INV-${String(max + 1).padStart(5, '0')}`, quoteId: quote.id, title: quote.title, lines: quote.lines.map(l => ({ ...l })), discount: quote.discount, issuedOn, due, business: { ...business }, customer: { ...customer } };
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
export function documentHtml(doc: { title: string; lines: Quote['lines']; discount: string; number: string; issuedOn: string; due?: string; business: Business; customer: Customer }, kind: 'Quotation' | 'Invoice'): string {
  const e = escapeHtml, b = doc.business, c = doc.customer, totals = quoteTotals(doc.lines, doc.discount);
  const logo = b.logo && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(b.logo) ? `<img alt="Business logo" src="${b.logo}">` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${kind} ${e(doc.number)}</title><style>
  @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#18352f;margin:0}header{border-bottom:3px solid #176348;padding-bottom:22px;display:flex;justify-content:space-between;gap:20px}h1{font-size:29px;margin:0 0 10px}h2{font-size:19px;margin:0 0 10px}p{line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:130px;max-height:75px;object-fit:contain;margin-bottom:12px}.meta{text-align:right}.muted{color:#596c66}section{padding:20px 0}table{border-collapse:collapse;width:100%;table-layout:fixed}thead{display:table-header-group}th{background:#18352f;color:white;text-align:left;padding:10px}td{padding:11px 10px;border-bottom:1px solid #dfe6e2;overflow-wrap:anywhere;vertical-align:top}tr{break-inside:avoid}th:first-child{width:40%}.num{text-align:right}.totals{margin:18px 0 24px auto;width:270px;break-inside:avoid}.totals p{display:flex;justify-content:space-between}.grand{background:#eaf1e8;padding:12px;font-size:17px;font-weight:bold}footer{border-top:1px solid #dfe6e2;padding-top:15px;margin-top:26px}.terms{white-space:pre-wrap}</style></head><body>
  <header><div>${logo}<h2>${e(b.name)}</h2><p>${e(b.address)}<br>${e(b.phone)}${b.email ? '<br>' + e(b.email) : ''}${b.registration ? '<br>Registration: ' + e(b.registration) : ''}</p></div><div class="meta"><h1>${kind.toUpperCase()}</h1><p>${e(doc.number)}<br>Issued: ${e(doc.issuedOn)}${doc.due ? '<br>Due: ' + e(doc.due) : ''}</p></div></header>
  <section><span class="muted">${kind === 'Invoice' ? 'BILL TO' : 'PREPARED FOR'}</span><h2>${e(c.name)}</h2><p>${e(c.phone)}<br>${e(c.site)}</p><h2>${e(doc.title)}</h2></section>
  <table><thead><tr><th>Description</th><th class="num">Quantity</th><th>Unit</th><th class="num">Rate (MWK)</th><th class="num">Amount (MWK)</th></tr></thead><tbody>${doc.lines.map(l => `<tr><td>${e(l.description)}</td><td class="num">${e(l.quantity)}</td><td>${e(l.unit)}</td><td class="num">${e(l.price)}</td><td class="num">${money(lineTotal(l)).replace('MWK ', '')}</td></tr>`).join('')}</tbody></table>
  <div class="totals"><p><span>Subtotal</span><span>${money(totals.subtotal)}</span></p><p><span>Discount (${e(doc.discount || '0')}%)</span><span>${money(totals.discount)}</span></p><p class="grand"><span>Total</span><span>${money(totals.total)}</span></p><p>Tax not charged.</p></div>
  ${kind === 'Invoice' && b.paymentDetails ? `<h2>Payment details</h2><p>${e(b.paymentDetails)}</p><p>Use ${e(doc.number)} as your payment reference.</p>` : ''}
  ${b.terms ? `<h2>Terms</h2><p class="terms">${e(b.terms)}</p>` : ''}<footer>${kind === 'Quotation' ? 'Quotation only. This document is not an invoice or payment receipt.' : 'Invoice for the services listed above. This document is not proof of payment.'}<p>Thank you for choosing ${e(b.name)}.</p></footer></body></html>`;
}
