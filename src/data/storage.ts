import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppData } from "../domain/model";
export const STORAGE_KEY = "service-tracker:demo:v1";
export async function loadData(): Promise<AppData | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.quotes) ||
    !Array.isArray(data.jobs) ||
    (data.invoices !== undefined && !Array.isArray(data.invoices))
  )
    throw new Error(
      "Saved data cannot be loaded. Export or restore it before continuing.",
    );
  return data as AppData;
}
export async function saveData(data: AppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
