import { documentHtml } from '../domain/documents';
import { findTemplate, freeTemplateStyles } from '../domain/templates';
import { loadPaidTemplateStyle } from './account';
import { exportDocument, openDocumentWindow } from './exportDocument';

export async function exportWithTemplate(doc: Parameters<typeof documentHtml>[0], kind: 'Invoice' | 'Quotation', templateId: string, paid = 0n) {
  const template = findTemplate(templateId);
  // Reserve the popup during the user gesture, before the entitlement request.
  const preview = openDocumentWindow();
  try {
    const css = template.premium ? await loadPaidTemplateStyle(template.id) : freeTemplateStyles[template.id];
    await exportDocument(documentHtml(doc, kind, { paid, templateCss: css }), preview);
  } catch (error) { preview?.close(); throw error; }
}
