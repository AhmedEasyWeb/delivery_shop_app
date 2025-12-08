import {
  ForegroundService,
  ServiceType,
} from "@capawesome-team/capacitor-android-foreground-service";

export async function startDriverForegroundService() {
  await ForegroundService.startForegroundService({
    id: 101,
    title: "Delivery Shop",
    body: "في انتظار الطلبات الجديدة ...",
    smallIcon: "ic_launcher_foreground",
    serviceType: ServiceType.Location,
  });
}

export async function stopDriverForegroundService() {
  await ForegroundService.stopForegroundService();
}
