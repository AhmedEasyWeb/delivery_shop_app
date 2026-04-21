import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export async function setLocalData(itemName: string, itemData: any) {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(itemName, JSON.stringify(itemData));
    return;
  }

  await Preferences.set({
    key: itemName,
    value: typeof itemData === "string" ? itemData : JSON.stringify(itemData),
  });
}

export async function getLocalData(itemName: string) {
  if (!Capacitor.isNativePlatform()) {
    const data = localStorage.getItem(itemName);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  const { value } = await Preferences.get({ key: itemName });
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function removeLocalData(itemName: string) {
  if (!Capacitor.isNativePlatform()) {
    localStorage.removeItem(itemName);
    return;
  }

  await Preferences.remove({ key: itemName });
}
