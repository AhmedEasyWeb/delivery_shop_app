import { ref, onUnmounted, type Ref } from "vue";
import { toast } from "vue-sonner";
import { LocalNotifications } from "@capacitor/local-notifications";

const WS_URL = "wss://deliveryshop.cloud/";

interface WSMessage {
  type: string;
  [key: string]: any;
}

export async function requestNotificationPermission() {
  const permission = await LocalNotifications.requestPermissions();
  return permission.display === "granted";
}

async function notifyUser(title: string, body: string) {
  const permission = await LocalNotifications.checkPermissions();

  if (permission.display !== "granted") {
    const requested = await requestNotificationPermission();
    if (!requested) return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 10000),
        title,
        body,
        largeIcon: "res://drawable/notification_icon",
        schedule: { at: new Date(Date.now() + 100) },
      },
    ],
  });
}

export function useWebRestaurantSocket(restaurantId: number) {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const messages = ref<WSMessage[]>([]);

  function connect() {
    if (ws.value?.readyState === WebSocket.OPEN) return;

    ws.value = new WebSocket(WS_URL);

    ws.value.onopen = () => {
      isConnected.value = true;
      console.log("✅ WebSocket Connected");

      sendMessage({
        type: "restaurant_init",
        restaurant_id: restaurantId,
      });
    };

    ws.value.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        messages.value.push(data);

        if (data.type === "order_assaging_failed") {
          notifyUser(
            "فشل إرسال الطلب",
            `الطلب رقم ${data.order_id} لم يتمكن من الإرسال!`,
          );
        }

        console.log("📩 New message:", data);
      } catch (err) {
        console.error("⚠️ Failed to parse message:", err);
      }
    };

    ws.value.onclose = (event) => {
      isConnected.value = false;
      if (event.code !== 1000) {
        console.warn("❌ Connection lost. Reconnecting in 3s...");
        toast.warning("Connection lost. Reconnecting...");
        setTimeout(connect, 3000);
      }
    };

    ws.value.onerror = (err) => {
      console.error("WebSocket Error:", err);
      ws.value?.close();
    };
  }

  const sendMessage = (data: object) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
    } else {
      console.error("❌ Cannot send: WebSocket is not open.");
    }
  };

  connect();
  onUnmounted(() => {
    if (ws.value) {
      ws.value.close(1000);
    }
  });

  return {
    ws,
    isConnected,
    messages,
    sendMessage,
  };
}
