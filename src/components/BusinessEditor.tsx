import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Business } from "../domain/model";
import { normalisePhone } from "../domain/model";
import { Banner, Button, Field, ui } from "./ui";

type FieldKey = Exclude<keyof Business, "logo">;

const fields: readonly [FieldKey, string, string?][] = [
  ["name", "Business name *"],
  ["owner", "Owner name *"],
  ["phone", "Business phone *", "Shown on your quotations and invoices."],
  ["email", "Email"],
  ["address", "Business address *"],
  ["registration", "Business registration number (optional)"],
  [
    "paymentDetails",
    "Payment instructions / bank details",
    "Printed on invoices so customers know how to pay.",
  ],
  ["terms", "Default document terms"],
];

export function BusinessEditor({
  business,
  onSave,
  onCancel,
}: {
  business?: Business;
  onSave: (b: Business) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Business>(
    business ?? {
      name: "",
      owner: "",
      address: "",
      phone: "",
      email: "",
      registration: "",
      paymentDetails: "",
      terms: "",
    },
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [busy, setBusy] = useState(false);

  async function logo() {
    setError("");
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64 || asset.base64.length > 1400000)
        throw new Error("Choose a smaller logo (under 1 MB).");
      const mime = asset.mimeType === "image/png" ? "image/png" : "image/jpeg";
      setValue((v) => ({ ...v, logo: `data:${mime};base64,${asset.base64}` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not select logo.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const clean = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          typeof val === "string" ? val.trim() : val,
        ]),
      ) as Business;

      const problems: Partial<Record<FieldKey, string>> = {};
      if (!clean.name) problems.name = "Enter your business name.";
      if (!clean.owner) problems.owner = "Enter the owner's name.";
      if (!clean.address) problems.address = "Enter your business address.";
      if (!clean.phone) problems.phone = "Enter a contact phone number.";
      if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email))
        problems.email = "Enter a valid email address.";
      if (Object.keys(problems).length) {
        setFieldErrors(problems);
        throw new Error("Please fix the highlighted fields.");
      }

      clean.phone = normalisePhone(clean.phone);
      await onSave(clean);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save business details.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <Text accessibilityRole="header" style={ui.title}>
        {business ? "Business profile" : "Register your business profile"}
      </Text>
      <Text style={ui.muted}>
        Set up your business identity for quotations and invoices. Details are
        saved to your private workspace and appear on new quotations and
        invoices. This does not register your business with a government
        authority.
      </Text>
      {value.logo && (
        <Image
          accessibilityLabel="Business logo"
          source={{ uri: value.logo }}
          style={{ width: 100, height: 100, borderRadius: 12 }}
          resizeMode="contain"
        />
      )}
      <View style={ui.row}>
        <Button
          title={value.logo ? "Change logo" : "Choose logo"}
          secondary
          disabled={busy}
          onPress={logo}
        />
        {value.logo && (
          <Button
            title="Remove logo"
            variant="danger"
            disabled={busy}
            onPress={() => setValue((v) => ({ ...v, logo: undefined }))}
          />
        )}
      </View>
      {fields.map(([key, label, hint]) => (
        <Field
          key={key}
          label={label}
          hint={hint}
          error={fieldErrors[key]}
          value={value[key] ?? ""}
          onChangeText={(text) => {
            setValue((v) => ({ ...v, [key]: text }));
            if (fieldErrors[key])
              setFieldErrors((f) => ({ ...f, [key]: undefined }));
          }}
          multiline={
            key === "address" || key === "paymentDetails" || key === "terms"
          }
        />
      ))}
      {!!error && (
        <Banner tone="danger" text={error} onDismiss={() => setError("")} />
      )}
      <View style={ui.row}>
        <Button title="Save business profile" loading={busy} onPress={save} />
        <Button title="Cancel" secondary disabled={busy} onPress={onCancel} />
      </View>
    </ScrollView>
  );
}
