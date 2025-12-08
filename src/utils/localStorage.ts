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
    return JSON.parse(localStorage.getItem(itemName) || "");
  }

  return (await Preferences.get({ key: "sessionToken" })).value;
}

export async function removeLocalData(itemName: string) {
  if (Capacitor.getPlatform() === "web") {
    localStorage.removeItem(itemName);
    return;
  }

  await Preferences.remove({ key: itemName });
}
