import { ref } from "vue";
import { registerPlugin } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

export function useDriverGeolocation() {
  const lastLocation = ref<{ lat: number; lng: number } | null>(null);
  let watcherId: string | null = null;

  async function startTracking(
    onUpdate: (loc: { lat: number; lng: number }) => void,
  ) {
    try {
      // Immediate location
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      lastLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      onUpdate(lastLocation.value);

      // Background watcher
      const result = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: "تتبع السائق",
          backgroundMessage: "في انتظار الطلبات الجديدة...",
          distanceFilter: 40,
          requestPermissions: true,
          stale: false,
        },
        (location: Location | undefined) => {
          if (!location) return;
          lastLocation.value = {
            lat: location.latitude,
            lng: location.longitude,
          };
          onUpdate(lastLocation.value);
        },
      );
      watcherId = result;
    } catch (err) {
      console.error("❌ Geolocation Error:", err);
    }
  }

  async function stopTracking() {
    if (watcherId) {
      await BackgroundGeolocation.removeWatcher({ id: watcherId });
      watcherId = null;
    }
  }

  return { lastLocation, startTracking, stopTracking };
}
