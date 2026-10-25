import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { documentTemplates } from '../domain/templates';
import { loadTemplateAccess } from '../data/account';
import { Badge, Button, colors, ui } from './ui';

export function TemplatePicker({ onClose, onExport, onUpgrade }: { onClose: () => void; onExport: (id: string) => Promise<void>; onUpgrade?: () => void }) {
  const [selected, setSelected] = useState('classic');
  const [paidAccess, setPaidAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    loadTemplateAccess().then(allowed => { if (active) setPaidAccess(allowed); })
      .catch(() => { if (active) setError('Paid access could not be checked. Free templates are available. Ask the administrator to apply the latest SQL setup if this persists.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  const chosen = documentTemplates.find(t => t.id === selected)!;
  async function download() {
    if (lock.current || (chosen.premium && !paidAccess)) return;
    lock.current = true; setBusy(true); setError('');
    try { await onExport(selected); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not export document.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={ui.title}>Choose your template</Text><Text style={ui.muted}>3 free designs. 10 more with a paid subscription.</Text></View><Button title="Close" secondary disabled={busy} onPress={onClose} /></View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        {checking && <Text style={ui.muted}>Checking subscription access...</Text>}
        {!!error && <Text accessibilityRole="alert" style={ui.muted}>{error}</Text>}
        {['Free templates', 'Paid templates'].map((group, index) => <View key={group} style={{ gap: 14 }}><Text style={ui.title}>{group}</Text><View style={[ui.row, { alignItems: 'stretch' }]}>
          {documentTemplates.filter(t => t.premium === !!index).map(t => {
            const locked = t.premium && !paidAccess;
            return <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`${t.name}, ${locked ? 'paid template locked' : 'available'}`} accessibilityState={{ selected: selected === t.id, disabled: busy }} disabled={busy} onPress={() => setSelected(t.id)} style={[ui.card, { flexGrow: 1, flexBasis: 220, maxWidth: 330, borderWidth: 2, borderColor: selected === t.id ? colors.green : colors.border, padding: 16 }]}>
              <View accessible={false} style={{ backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: '#e1e5e1', height: 154, gap: 10 }}>
                <View style={{ height: t.layout === 'banner' ? 28 : 6, backgroundColor: t.accent }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View style={{ width: '42%', height: 8, backgroundColor: '#d9dfda' }} /><Text style={{ fontSize: 9, fontWeight: '700', color: t.accent, fontFamily: t.layout === 'serif' ? 'Georgia' : undefined }}>INVOICE</Text></View>
                <View style={{ width: '36%', height: 13, backgroundColor: '#edf0ec' }} />
                <View style={{ height: t.layout === 'compact' ? 12 : 17, backgroundColor: t.layout === 'minimal' ? '#eee' : t.accent }} />
                <View style={{ height: 1, backgroundColor: '#ddd' }} /><View style={{ height: 1, backgroundColor: '#ddd' }} />
                <View style={{ width: '40%', alignSelf: 'flex-end', height: 13, backgroundColor: t.accent, opacity: 0.25 }} />
              </View><Badge text={t.premium ? paidAccess ? 'PAID - AVAILABLE' : 'PAID - LOCKED' : 'FREE'} /><Text style={ui.label}>{t.name}</Text><Text style={ui.muted}>{t.description}</Text><Text style={{ color: colors.green, fontWeight: '600' }}>{selected === t.id ? 'Selected' : 'Choose template'}</Text>
            </Pressable>;
          })}
        </View></View>)}
      </ScrollView>
      <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: 'white' }}>
        <Text style={ui.label}>{chosen.name}{chosen.premium && !paidAccess ? ' - paid subscription required' : ''}</Text>
        {chosen.premium && !paidAccess ? <><Text style={ui.muted}>Unlock after payment is verified. Registering interest does not activate access.</Text><Button title="View subscription plans" disabled={busy} onPress={() => { onClose(); onUpgrade?.(); router.push({ pathname: '/[section]', params: { section: 'plans' } }); }} /></> : <Button title={busy ? 'Preparing PDF...' : 'Export PDF with this template'} disabled={busy} onPress={() => void download()} />}
      </View>
    </SafeAreaView>
  </Modal>;
}
