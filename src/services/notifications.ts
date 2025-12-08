import { LocalNotifications } from "@capacitor/local-notifications";

export async function setupDriverNotificationChannel() {
  await LocalNotifications.createChannel({
    id: "orders_channel",
    name: "Orders Notifications",
    description: "Channel for nearby order alerts",
    importance: 5,
    sound: "order_sound",
    vibration: true,
    visibility: 1,
  });
}

export function showNearbyOrderNotification(order: any) {
  LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title: "📦 طلب جديد قريب منك",
        body: `الطلب من ${order.restaurant.name}`,
        channelId: "orders_channel",
        smallIcon: "ic_launcher_foreground",
        sound: "order_sound",
      },
    ],
  });
}

export function showOrderUpdatedNotification(order_id: number) {
  LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title: "📦 تم تحديث الطلب",
        body: `الطلب رقم ${order_id}`,
        channelId: "orders_channel",
        smallIcon: "ic_launcher_foreground",
        sound: "order_sound",
      },
    ],
  });
}
