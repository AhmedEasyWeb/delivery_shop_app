import { registerPlugin } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

export function useDriverGeolocation() {
  let watcherId: string | null = null;

  async function start(
    onLocation: (location: Location | undefined, error?: any) => void
  ) {
    watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "تتبع السائق",
        backgroundMessage: "في انتظار الطلبات الجديدة...",
        distanceFilter: 40,
        requestPermissions: true,
        stale: false,
      },
      onLocation
    );

    return watcherId;
  }

  async function stop() {
    if (watcherId) {
      await BackgroundGeolocation.removeWatcher({ id: watcherId });
      watcherId = null;
    }
  }

  return { start, stop };
}
