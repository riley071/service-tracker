import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export const colors = {
  ink: "#132F2A",
  muted: "#667972",
  green: "#176348",
  lime: "#DBEF9E",
  bg: "#F5F7F3",
  border: "#DDE5DE",
  white: "#FFFFFF",
  surface: "#FCFDF9",
  danger: "#A33124",
  dangerBg: "#FBEAE7",
  warn: "#7A5200",
  warnBg: "#FFF4DB",
  info: "#1F5F8B",
  infoBg: "#E6F1F8",
};

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  title,
  onPress,
  secondary = false,
  variant,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  /** Kept for backwards compatibility; same as variant="secondary". */
  secondary?: boolean;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}) {
  const kind: ButtonVariant = variant ?? (secondary ? "secondary" : "primary");
  const inactive = disabled || loading;
  const textColor =
    kind === "primary"
      ? colors.white
      : kind === "danger"
        ? colors.danger
        : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        ui.button,
        kind === "secondary" && ui.secondary,
        kind === "danger" && ui.dangerButton,
        kind === "ghost" && ui.ghost,
        { opacity: inactive ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={kind === "primary" ? colors.white : colors.green}
        />
      ) : (
        <Text style={[ui.buttonText, { color: textColor }]}>{title}</Text>
      )}
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
  error,
  hint,
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
  error?: string;
  hint?: string;
  secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7, marginBottom: 14 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#819087"
        keyboardType={numeric ? "decimal-pad" : "default"}
        secureTextEntry={secure}
        autoCapitalize={secure ? "none" : "sentences"}
        multiline={multiline}
        style={[
          ui.input,
          focused && { borderColor: colors.green, borderWidth: 2 },
          !!error && { borderColor: colors.danger },
          multiline && { minHeight: 88, textAlignVertical: "top" },
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.errorText}>
          {error}
        </Text>
      )}
      {!error && !!hint && <Text style={ui.hint}>{hint}</Text>}
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
          style={({ pressed }) => [
            ui.chip,
            value === item && {
              backgroundColor: colors.ink,
              borderColor: colors.ink,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              color: value === item ? "white" : colors.ink,
              fontWeight: value === item ? "600" : "400",
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type Tone = "green" | "warn" | "danger" | "info" | "neutral";
const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: "#EAF3E5", fg: colors.green },
  warn: { bg: colors.warnBg, fg: colors.warn },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.infoBg, fg: colors.info },
  neutral: { bg: "#EEF1EC", fg: colors.muted },
};

export function Badge({ text, tone = "green" }: { text: string; tone?: Tone }) {
  const t = toneStyles[tone];
  return (
    <View style={[ui.badge, { backgroundColor: t.bg }]}>
      <Text style={{ color: t.fg, fontWeight: "600", fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );
}

/** Inline message strip for success, warning and error feedback. */
export function Banner({
  text,
  tone = "info",
  onDismiss,
}: {
  text: string;
  tone?: Tone;
  onDismiss?: () => void;
}) {
  const t = toneStyles[tone];
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      style={[ui.banner, { backgroundColor: t.bg, borderColor: t.fg + "33" }]}
    >
      <Text style={{ color: t.fg, flex: 1, fontSize: 14, lineHeight: 20 }}>
        {text}
      </Text>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onDismiss}
          hitSlop={10}
        >
          <Text style={{ color: t.fg, fontSize: 18, fontWeight: "700" }}>
            ×
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={ui.empty}>
      <Text style={[ui.title, { fontSize: 18, textAlign: "center" }]}>
        {title}
      </Text>
      {!!body && (
        <Text style={[ui.muted, { textAlign: "center" }]}>{body}</Text>
      )}
      {action}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={[ui.row, { justifyContent: "space-between" }]}>
      <Text accessibilityRole="header" style={ui.title}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: "0 1px 2px rgba(19,47,42,0.05)" } as object,
  default: {
    shadowColor: "#132F2A",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

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
    ...shadow,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  hint: { fontSize: 12, color: colors.muted },
  errorText: { fontSize: 12, color: colors.danger },
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
  dangerButton: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: "#E8C4BD",
  },
  ghost: { backgroundColor: "transparent" },
  buttonText: { fontWeight: "600", fontSize: 14, color: "white" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: "white",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF3E5",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    padding: 32,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
});
