import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportDocument(html: string) {
  if (Platform.OS === 'web') {
    // Open synchronously from the button press so browsers allow the print window.
    const preview = window.open('', '_blank');
    if (!preview) throw new Error('Allow pop-ups to open the document, then choose Save as PDF.');
    let printed = false;
    const print = () => { if (!printed) { printed = true; preview.focus(); preview.print(); } };
    preview.onload = print;
    preview.document.write(html);
    preview.document.close();
    if (preview.document.readyState === 'complete') print();
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('Document sharing is unavailable on this device.');
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: 'Save or share document' });
}
