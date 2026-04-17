import { ref, onUnmounted } from "vue";

// ─── Singleton state (module-level, shared across all callers) ───────────────
const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);
const messages = ref<any[]>([]);
const messageQueue: any[] = [];

let isIntentionallyClosed = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let activeRestaurantId: number | null = null;

// Track how many composable instances are currently mounted
let consumerCount = 0;

export const WS_URL = "wss://deliveryshop.cloud";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function notifyUser(title: string, body: string) {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") new Notification(title, { body });
    });
  }
}

// ─── Core connect (idempotent) ────────────────────────────────────────────────

function connect(id: number) {
  // Do nothing if already open or connecting for the same restaurant
  if (
    ws.value &&
    (ws.value.readyState === WebSocket.OPEN ||
      ws.value.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  isIntentionallyClosed = false;
  activeRestaurantId = id;

  console.log("🔌 Opening WebSocket for restaurant:", id);
  ws.value = new WebSocket(WS_URL);

  ws.value.onopen = () => {
    isConnected.value = true;
    console.log("✅ WebSocket connected");

    ws.value?.send(
      JSON.stringify({ type: "restaurant_init", restaurant_id: id }),
    );

    // Flush queued messages
    while (messageQueue.length > 0) {
      const queued = messageQueue.shift();
      ws.value?.send(JSON.stringify(queued));
    }
  };

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      messages.value.push(data);
      if (messages.value.length > 200) messages.value.shift();

      if (data.type === "order_assaging_failed") {
        notifyUser(
          "فشل إرسال الطلب",
          `الطلب رقم ${data.order_id} لم يتمكن من الإرسال!`,
        );
      }

      console.log("📩 New message:", data);
    } catch (err) {
      console.error("❌ Failed to parse WebSocket message:", err);
    }
  };

  ws.value.onclose = (event) => {
    isConnected.value = false;
    console.warn(`⚠️ WebSocket closed (code ${event.code})`);

    if (!isIntentionallyClosed && activeRestaurantId !== null) {
      console.warn("🔄 Reconnecting in 3 s…");
      reconnectTimer = setTimeout(() => connect(activeRestaurantId!), 3000);
    }
  };

  ws.value.onerror = (err) => {
    console.error("WebSocket error:", err);
    // onclose fires automatically after onerror — no need to call close() manually
  };
}

function disconnect() {
  isIntentionallyClosed = true;
  activeRestaurantId = null;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }

  isConnected.value = false;
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWebSocket(restaurantId: number) {
  // Only open a new connection when there isn't one already alive
  if (
    !ws.value ||
    ws.value.readyState === WebSocket.CLOSED ||
    ws.value.readyState === WebSocket.CLOSING
  ) {
    connect(restaurantId);
  }

  consumerCount++;

  // Re-send init if the socket is already open but pointing at a different restaurant
  const init = (id: number) => {
    if (!id) return;

    if (ws.value?.readyState === WebSocket.OPEN) {
      activeRestaurantId = id;
      ws.value.send(
        JSON.stringify({ type: "restaurant_init", restaurant_id: id }),
      );
    } else {
      connect(id);
    }
  };

  const sendMessage = (data: object) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not open — message queued.");
      messageQueue.push(data);

      if (!ws.value || ws.value.readyState === WebSocket.CLOSED) {
        connect(activeRestaurantId ?? restaurantId);
      }
    }
  };

  // Only close the socket when the LAST consumer unmounts
  onUnmounted(() => {
    consumerCount--;
    if (consumerCount <= 0) {
      consumerCount = 0;
      disconnect();
      console.log("🔌 WebSocket closed — no more consumers.");
    }
  });

  return { ws, isConnected, messages, sendMessage, init };
}
