import React, { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Business } from '../domain/model';
import { normalisePhone } from '../domain/model';
import { Button, Field, ui } from './ui';

export function BusinessEditor({ business, onSave, onCancel }: { business?: Business; onSave: (b: Business) => Promise<void>; onCancel: () => void }) {
  const [value, setValue] = useState<Business>(business ?? { name: '', owner: '', address: '', phone: '', email: '', registration: '', paymentDetails: '', terms: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logo() {
    setError('');
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64 || asset.base64.length > 1400000) throw new Error('Choose a smaller logo (under 1 MB).');
      const mime = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      setValue(v => ({ ...v, logo: `data:${mime};base64,${asset.base64}` }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not select logo.'); }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setError('');
    try {
      const clean = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val?.trim()])) as Business;
      if (!clean.name || !clean.owner || !clean.address) throw new Error('Enter your business name, owner name and address.');
      clean.phone = normalisePhone(clean.phone);
      if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('Enter a valid email address.');
      await onSave(clean);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save business details.'); }
    finally { setBusy(false); }
  }
  const fields = [['name', 'Business name *'], ['owner', 'Owner name *'], ['phone', 'Business phone *'], ['email', 'Email'], ['address', 'Business address *'], ['registration', 'Business registration number (optional)'], ['paymentDetails', 'Payment instructions / bank details'], ['terms', 'Default document terms']] as const;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Text style={ui.title}>{business ? 'Business profile' : 'Register your business profile'}</Text>
    <Text style={ui.muted}>Set up your business identity for quotations and invoices. Details are saved to your private Supabase workspace and appear on new quotations and invoices. This does not register your business with a government authority.</Text>
    {value.logo && <Image accessibilityLabel="Business logo" source={{ uri: value.logo }} style={{ width: 100, height: 100 }} resizeMode="contain" />}
    <View style={ui.row}><Button title="Choose logo" secondary disabled={busy} onPress={logo} />{value.logo && <Button title="Remove logo" secondary disabled={busy} onPress={() => setValue(v => ({ ...v, logo: undefined }))} />}</View>
    {fields.map(([key, label]) => <Field key={key} label={label} value={value[key]} onChangeText={text => setValue(v => ({ ...v, [key]: text }))} multiline={key === 'address' || key === 'paymentDetails' || key === 'terms'} />)}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#A33124' }}>{error}</Text>}
    <Button title={busy ? 'Saving…' : 'Save business profile'} disabled={busy} onPress={save} />
    <Button title="Cancel" secondary disabled={busy} onPress={onCancel} />
  </ScrollView>;
}
