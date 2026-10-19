import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
export const colors = {
  ink: "#132F2A",
  muted: "#667972",
  green: "#176348",
  lime: "#DBEF9E",
  bg: "#F5F7F3",
  border: "#DDE5DE",
  white: "#FFFFFF",
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[ui.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder = "",
  numeric = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 7, marginBottom: 14 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#819087"
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        style={[
          ui.input,
          multiline && { minHeight: 88, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Chips({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <View style={ui.row}>
      {items.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item }}
          onPress={() => onChange(item)}
          style={[
            ui.chip,
            value === item && {
              backgroundColor: colors.ink,
              borderColor: colors.ink,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              color: value === item ? "white" : colors.ink,
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Badge({ text }: { text: string }) {
  return (
    <View style={ui.badge}>
      <Text style={{ color: colors.green, fontWeight: "600", fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 22,
    gap: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: "#CDD9D0",
    backgroundColor: "#FAFCF9",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: { backgroundColor: "#EDF2EB" },
  buttonText: { fontWeight: "600", fontSize: 14, color: "white" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 40,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF3E5",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
});
