import { LocalNotifications } from "@capacitor/local-notifications";

export function useDriverNotifications() {
  async function requestPermissions() {
    const permResult = await LocalNotifications.requestPermissions();
    return permResult.display === "granted";
  }

  async function setupNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: "orders_channel",
        name: "Orders Notifications",
        description: "Channel for nearby order alerts",
        importance: 5,
        sound: "order_sound",
        vibration: true,
        visibility: 1,
      });
    } catch (err) {
      console.error("❌ Notification Channel Error:", err);
    }
  }

  function showOrderNotification(order: any) {
    LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1000000),
          title: "📦 طلب جديد قريب منك",
          body: `الطلب من ${order.restaurant.name}`,
          channelId: "orders_channel",
          smallIcon: "ic_launcher_foreground",
          sound: "order_sound",
          schedule: { allowWhileIdle: true },
        },
      ],
    });
  }

  function showUpdateOrderNotification(orderId: any) {
    LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1000000),
          title: "📦 تم تحديث الطلب",
          body: `الطلب برقم ${orderId}`,
          channelId: "orders_channel",
          smallIcon: "ic_launcher_foreground",
          sound: "order_sound",
          schedule: { allowWhileIdle: true },
        },
      ],
    });
  }

  return {
    requestPermissions,
    setupNotificationChannel,
    showOrderNotification,
    showUpdateOrderNotification,
  };
}
