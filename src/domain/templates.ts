export type DocumentTemplate = { id: string; name: string; description: string; premium: boolean; accent: string; layout: 'classic' | 'minimal' | 'banner' | 'serif' | 'compact' };
export const documentTemplates: DocumentTemplate[] = [
  { id: 'classic', name: 'Classic Green', description: 'Clean business header and clear totals.', premium: false, accent: '#176348', layout: 'classic' },
  { id: 'minimal', name: 'Minimal', description: 'Quiet black and white, ideal for printing.', premium: false, accent: '#333333', layout: 'minimal' },
  { id: 'ledger', name: 'Simple Ledger', description: 'A compact, structured accounting layout.', premium: false, accent: '#425466', layout: 'compact' },
  { id: 'executive', name: 'Executive', description: 'Navy header with a formal document finish.', premium: true, accent: '#183153', layout: 'banner' },
  { id: 'artisan', name: 'Artisan', description: 'Warm terracotta and traditional typography.', premium: true, accent: '#9a4d36', layout: 'serif' },
  { id: 'blueprint', name: 'Blueprint', description: 'Technical blue detailing for project work.', premium: true, accent: '#225ea8', layout: 'compact' },
  { id: 'signature', name: 'Signature', description: 'Editorial black and gold with generous spacing.', premium: true, accent: '#80621e', layout: 'serif' },
  { id: 'fresh', name: 'Fresh', description: 'Teal panels and a modern rounded finish.', premium: true, accent: '#087f8c', layout: 'banner' },
  { id: 'studio', name: 'Studio', description: 'Violet accents and a centred business identity.', premium: true, accent: '#6842a6', layout: 'classic' },
  { id: 'contractor', name: 'Contractor', description: 'Bold charcoal and amber for trade services.', premium: true, accent: '#9c5700', layout: 'banner' },
  { id: 'elegant', name: 'Elegant', description: 'Burgundy serif typography and fine rules.', premium: true, accent: '#8c3548', layout: 'serif' },
  { id: 'horizon', name: 'Horizon', description: 'Sky-blue header with a horizontal identity.', premium: true, accent: '#246a91', layout: 'classic' },
  { id: 'precision', name: 'Precision', description: 'Dense monochrome rows and numbered details.', premium: true, accent: '#303a42', layout: 'compact' },
];
export function findTemplate(id: string) {
  const template = documentTemplates.find(t => t.id === id);
  if (!template) throw new Error('Choose a valid document template.');
  return template;
}
// Only the free designs ship with the app. Paid styles are returned by Supabase RLS.
export const freeTemplateStyles: Record<string, string> = {
  classic: '',
  minimal: '.masthead{border-top:0;border-bottom:2px solid #222}h1,.thanks{color:#222}h1{font-weight:700;letter-spacing:0}.scope{background:white;border-left:2px solid #222;border-radius:0}th{background:white;color:#222;border-bottom:2px solid #222}tbody tr:nth-child(even){background:white}.balance{background:#f4f4f4;border-left:0;border-top:2px solid #222}.label{letter-spacing:.6px}.site{border-left:1px solid #ddd}',
  ledger: 'body{font-family:Courier New,monospace;font-size:10px}.masthead{border-top:2px solid #425466;padding-top:15px}h1{font-size:27px;color:#425466;font-weight:700;letter-spacing:0}.business-name{font-size:19px}.scope{background:#f0f3f6;border-radius:0}th{background:#425466}th,td{padding:8px;border:1px solid #d8dee5}.balance{border-left:0;border-top:2px solid #425466;background:#f0f3f6;border-radius:0}.totals{width:320px}.thanks{color:#425466}',
};
