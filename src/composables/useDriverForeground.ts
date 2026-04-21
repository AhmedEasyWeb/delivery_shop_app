import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";

export function useDriverForeground() {
  async function startService() {
    try {
      await ForegroundService.startForegroundService({
        id: 101,
        title: "Delivery Shop",
        body: "في انتظار الطلبات الجديدة ...",
        smallIcon: "ic_launcher_foreground",
      });
    } catch (err) {
      console.error("❌ Foreground Service Error:", err);
    }
  }

  async function stopService() {
    try {
      await ForegroundService.stopForegroundService();
    } catch (err) {
      console.error("❌ Stop Service Error:", err);
    }
  }

  return { startService, stopService };
}
