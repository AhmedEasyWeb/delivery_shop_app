import { ref, onUnmounted, type Ref } from "vue";
import { toast } from "vue-sonner";
import { LocalNotifications } from "@capacitor/local-notifications";

const WS_URL = "wss://deliveryshop.cloud/";
// const WS_URL = "ws://192.168.1.8:3000";

interface RestaurantLocation {
  lat: number;
  lng: number;
}

interface WSMessage {
  type: string;
  [key: string]: any;
}

export async function requestNotificationPermission() {
  const permission = await LocalNotifications.requestPermissions();

  if (permission.display === "granted") {
    console.log("📱 Local notification permission granted");
    return true;
  } else {
    console.warn("❌ Local notification permission denied");
    return false;
  }
}

export async function notifyUser(title: string, body: string) {
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title,
        body,
        schedule: { at: new Date(Date.now() + 100) },
      },
    ],
  });
}

export function useWebRestaurantSocket(
  restaurantId: number,
  restaurantLocation: string,
): {
  ws: Ref<WebSocket | null>;
  isConnected: Ref<boolean>;
  messages: Ref<WSMessage[]>;
  sendMessage: (data: object) => void;
} {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const messages = ref<WSMessage[]>([]);

  function connect() {
    ws.value = new WebSocket(WS_URL);

    console.log("Trying to connect to WebSocket:", WS_URL);

    ws.value.onopen = () => {
      isConnected.value = true;
      ws.value?.send(
        JSON.stringify({
          type: "restaurant_init",
          restaurant_id: restaurantId,
        }),
      );
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
        console.error("⚠️ Failed to parse WebSocket message:", event.data, err);
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      console.warn("❌ WebSocket disconnected. Reconnecting in 3s...");
      toast.warning("WebSocket disconnected. Reconnecting...");
      setTimeout(connect, 3000);
    };

    ws.value.onerror = (err) => {
      console.error("WebSocket error:", err);
      toast.error("WebSocket connection failed. Check server status.");
      ws.value?.close();
    };
  }

  connect();

  onUnmounted(() => ws.value?.close());

  const sendMessage = (data: object) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not connected. Cannot send message:", data);
      toast.warning("Cannot send message. WebSocket not connected.");
    }
  };

  return { ws, isConnected, messages, sendMessage };
}
