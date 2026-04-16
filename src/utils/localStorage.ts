import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export async function setLocalData(itemName: string, itemData: any) {
  if (Capacitor.getPlatform() === "web") {
    localStorage.setItem(itemName, JSON.stringify(itemData));
    return;
  }
  if (Capacitor.getPlatform() === "android") {
    await Preferences.set({
      key: itemName,
      value: itemData,
    });
  }
}

export async function getLocalData(itemName: string) {
  if (Capacitor.getPlatform() === "web") {
    const data = localStorage.getItem(itemName);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  return (await Preferences.get({ key: itemName })).value;
}

export async function removeLocalData(itemName: string) {
  if (Capacitor.getPlatform() === "web") {
    localStorage.removeItem(itemName);
    return;
  }

  await Preferences.remove({ key: itemName });
}
