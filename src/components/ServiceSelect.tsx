import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { serviceGroups, trades } from "../domain/model";
import { colors, Field, ui } from "./ui";

export function ServiceSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState(value === "Other" || !trades.includes(value));
  const query = search.trim().toLowerCase();
  const groups = serviceGroups.map(group => ({ ...group, items: group.items.filter(item => item.toLowerCase().includes(query) || group.label.toLowerCase().includes(query)) }));
  return <View style={{ gap: 10 }}>
    <Text style={ui.label}>Service</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Service: ${custom ? value || "Other / custom service" : value}`} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[ui.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }]}>
      <Text style={{ color: colors.ink, flex: 1 }}>{custom ? "Other / custom service" : value}</Text>
      <Text style={{ color: colors.ink }}>{open ? "▲" : "▼"}</Text>
    </Pressable>
    {open && <View style={[ui.card, { padding: 12 }]}>
      <Field label="Search services" value={search} onChangeText={setSearch} placeholder="e.g. web development, plumbing" />
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 260 }}>
        {groups.map(group => group.items.length > 0 && <View key={group.label}>
          <Text style={[ui.label, { paddingVertical: 10 }]}>{group.label}</Text>
          {group.items.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: !custom && value === item }} onPress={() => { onChange(item); setCustom(false); setOpen(false); setSearch(""); }} style={{ minHeight: 48, padding: 12, borderRadius: 8, backgroundColor: !custom && value === item ? colors.lime : colors.white }}>
            <Text style={{ color: colors.ink }}>{item}</Text>
          </Pressable>)}
        </View>)}
        {!groups.some(group => group.items.length) && <Text style={ui.muted}>No matching services. Add your own below.</Text>}
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => { if (!custom) onChange(search.trim()); setCustom(true); setOpen(false); setSearch(""); }} style={[ui.input, { minHeight: 48 }]}>
        <Text style={ui.label}>+ Other / custom service</Text>
      </Pressable>
    </View>}
    {custom && <Field label="Custom service name" value={value} onChangeText={onChange} placeholder="Enter the service you provide" />}
  </View>;
}
