import { ref, onBeforeUnmount, onMounted } from "vue";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";
import { Geolocation } from "@capacitor/geolocation";
import { registerPlugin } from "@capacitor/core";
import { toast } from "vue-sonner";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

const WS_URL = "wss://deliveryshop.cloud";
// const WS_URL = "ws://localhost:8080";

type ConnectionTypes = "driver_init" | "location_update" | "update_orders";

type SimpleLocation = {
  lat: number;
  lng: number;
};

type DriverConnection = {
  type: ConnectionTypes;
  driver_id?: number;
  driver_name?: string;
  driver_type?: string;
  driver_city?: string;
  location?: SimpleLocation;
  driver_status?: string;
  driver_stationed_at?: any;
  driver_orders?: number[];
  timestamp?: number;
};

export function useDriverTracker() {
  const authStore = useAuthStore();
  const ordersStore = useOrdersStore();
  const driver = authStore.driver;
  const isOnline = ref(true);
  const isConnected = ref(true);
  const lastLocation = ref<{ lat: number; lng: number } | null>(null);

  let ws: WebSocket | null = null;
  let watcherId: string | null = null;
  let pingInterval: any = null;
  let hasSentInitialLocation = false;
  let wakeLock: any = null;
  let visibilityHandler: (() => void) | null = null;

  async function requestPermissions() {
    const permResult = await LocalNotifications.requestPermissions();

    if (permResult.display !== "granted") {
      console.log("⚠️ Notifications permission not granted");
    } else {
      console.log("✅ Notifications permission granted");
    }
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
      console.log("✅ Notification channel ready");
    } catch (err) {
      console.error("❌ Failed to create notification channel:", err);
    }
  }

  function showOrderNotification(order: any) {
    const notificationId = Math.floor(Math.random() * 1000000);
    setTimeout(() => {
      LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: "📦 طلب جديد قريب منك",
            body: `الطلب من ${order.restaurant.name}`,
            channelId: "orders_channel",
            smallIcon: "ic_launcher_foreground",
            sound: "order_sound",
            schedule: {
              allowWhileIdle: true,
            },
          },
        ],
      }).catch((err) =>
        alert(`❌ Notification failed:, ${JSON.stringify(err.message)}`),
      );
    }, 1000);
  }

  function showUpdateOrderNotification(order_id: any) {
    const notificationId = Math.floor(Math.random() * 1000000);
    setTimeout(() => {
      LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: "📦 تم تحديث الطلب",
            body: `الطلب برقم ${order_id}`,
            channelId: "orders_channel",
            smallIcon: "ic_launcher_foreground",
            sound: "order_sound",
            schedule: {
              allowWhileIdle: true,
            },
          },
        ],
      }).catch((err) =>
        alert(`❌ Notification failed:, ${JSON.stringify(err.message)}`),
      );
    }, 1000);
  }

  async function startForegroundService() {
    try {
      await ForegroundService.startForegroundService({
        id: 101,
        title: "Delivery Shop",
        body: "في انتظار الطلبات الجديدة ...",
        smallIcon: "ic_launcher_foreground",
      });
      console.log("✅ Foreground service started");
    } catch (err) {
      console.error("❌ Foreground service failed:", err);
    }
  }

  async function stopForegroundService() {
    try {
      await ForegroundService.stopForegroundService();
      console.log("🛑 Foreground service stopped");
    } catch (err) {
      console.error("❌ Failed to stop foreground service:", err);
    }
  }

  async function startGeolocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      lastLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      console.log("📍 Got immediate location:", lastLocation.value);

      const result = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: "تتبع السائق",
          backgroundMessage: "في انتظار الطلبات الجديدة...",
          distanceFilter: 40,
          requestPermissions: true,
          stale: false,
        },
        (location: Location | undefined, error?: any) => {
          if (error) {
            console.error("❌ Location error:", error);
            return;
          }
          if (!location) return;

          lastLocation.value = {
            lat: location.latitude,
            lng: location.longitude,
          };

          if (!ws || ws.readyState !== WebSocket.OPEN) return;

          if (!hasSentInitialLocation) {
            hasSentInitialLocation = true;
          }

          ws.send(
            JSON.stringify({
              type: "location_update",
              driver_id: authStore.driver?.driver_id,
              location: lastLocation.value,
              driver_stationed_at: authStore.driver?.stationed_at ?? null,
              driver_orders: ordersStore.orders.map((order) => order.order_id),
              timestamp: Date.now(),
            }),
          );
          console.log("📡 LIVE LOCATION SENT:", lastLocation.value);
        },
      );

      watcherId = result;
      console.log("✅ Geolocation watcher started");
    } catch (err) {
      console.error("❌ Geolocation failed:", err);
    }
  }
  async function stopGeolocation() {
    try {
      if (watcherId) {
        await BackgroundGeolocation.removeWatcher({ id: watcherId });
        watcherId = null;
      }
      console.log("🛑 Geolocation stopped");
    } catch (err) {
      console.error("❌ Failed to stop geolocation:", err);
    }
  }

  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ WS connected");
      isConnected.value = true;
      hasSentInitialLocation = false;
      sendInitialData();
      startHeartbeat();
    };

    ws.onclose = () => {
      console.log("❌ WS closed");
      isConnected.value = false;
      setTimeout(() => connectWebSocket(), 2000);
    };

    ws.onerror = (err) => {
      console.error("❌ WS error:", err);
      isConnected.value = false;
      ws?.close();
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new_order_nearby") {
          showOrderNotification(data.order);
          sendUpdateOrdersWs(data.order.order_id, data.order.restaurant_id);
          ordersStore.addOrder(data.order);
          authStore.setStationedAt(data.order.restaurant_id);
          toast.success("📦 طلب جديد قريب منك");
        }

        if (data.type === "new_orders_nearby") {
          // Show notification for the first one or a summary notification
          if (data.orders.length > 0) {
            showOrderNotification(data.orders[0]);
          }

          data.orders.forEach((order: any) => {
            sendUpdateOrdersWs(order.order_id, order.restaurant_id);
          });

          ordersStore.addOrders(data.orders);

          if (data.orders.length > 0) {
            authStore.setStationedAt(data.orders[0].restaurant_id);
          }
        }

        if (data.type === "updated_order") {
          ordersStore.updateOrder(data.order);
        }

        if (data.type === "order_status_updated") {
          const orderId = data.order_id || data.order?.order_id;
          const orderStatus = data.order_status || data.order?.order_status;

          if (orderStatus === "ready") {
            showUpdateOrderNotification(orderId);
          }
          if (orderStatus === "delivered" || orderStatus === "canceled") {
            ordersStore.removeOrder(orderId);
            sendFreeDriverWs();
            return;
          }
          if (data.order) {
            ordersStore.updateOrder(data.order);
          } else {
            ordersStore.updateOrderStatus(orderId, orderStatus);
          }
        }
      } catch (err) {
        console.error("❌ Failed to handle WS message:", err);
      }
    };
  }

  const handleChangeCity = (newCity: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "change_city",
        driver_id: driver?.driver_id,
        driver_city: newCity,
      }),
    );

    authStore.changeCity(newCity);
  };

  function sendUpdateOrdersWs(order_id: number, restaurant_id: number) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "update_orders",
        driver_id: driver?.driver_id,
        driver_stationed_at: restaurant_id,
        driver_status: "PICKING_UP",
        order_id: order_id,
      }),
    );
  }

  function sendFreeDriverWs() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "free_driver",
        driver_id: driver?.driver_id,
        driver_stationed_at: ordersStore.orders[0]?.restaurant_id ?? null,
        driver_orders: ordersStore.orders.map((order) => order.order_id),
        driver_status: "READY",
      }),
    );
  }

  function sendInitialData() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const data: DriverConnection = {
      type: "driver_init",
      driver_id: driver?.driver_id,
      driver_name: driver?.driver_full_name,
      driver_type: "driver",
      driver_city: driver?.driver_city,
      driver_status: "READY",
      driver_stationed_at: authStore.driver?.stationed_at ?? null,
      driver_orders: ordersStore.orders.map((o) => o.order_id),
      timestamp: Date.now(),
    };

    if (lastLocation.value) {
      data.location = lastLocation.value;
    }

    ws.send(JSON.stringify(data));
    console.log("🚀 DRIVER INIT SENT", data);
  }

  function startHeartbeat() {
    stopHeartbeat();

    pingInterval = setInterval(() => {
      // Reconnect WebSocket if it dropped while in background
      if (
        !ws ||
        ws.readyState === WebSocket.CLOSED ||
        ws.readyState === WebSocket.CLOSING
      ) {
        console.warn("💓 Heartbeat: WebSocket is dead, reconnecting...");
        connectWebSocket();
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        if (lastLocation.value) {
          ws.send(
            JSON.stringify({
              type: "location_update",
              driver_id: authStore.driver?.driver_id,
              location: lastLocation.value,
              driver_stationed_at: authStore.driver?.stationed_at ?? null,
              driver_orders: ordersStore.orders.map((order) => order.order_id),
              timestamp: Date.now(),
            }),
          );
          console.log("💓 HEARTBEAT SENT with location:", lastLocation.value);
        } else {
          console.log("⚠️ Heartbeat skipped - no location available yet");
        }
      }
    }, 20000);
  }

  function stopHeartbeat() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  async function acquireWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await (navigator as any).wakeLock.request("screen");
        console.log("✅ Wake lock acquired");

        wakeLock.addEventListener("release", () => {
          console.log("⚠️ Wake lock released");
        });
      }
    } catch (err) {
      console.warn("⚠️ Wake lock not available:", err);
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
      console.log("🛑 Wake lock released manually");
    }
  }

  function setupVisibilityListener() {
    if (visibilityHandler) return;

    visibilityHandler = () => {
      if (document.visibilityState === "visible" && isOnline.value) {
        console.log("👁️ App became visible, checking WebSocket...");
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
        acquireWakeLock();
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);
  }

  function removeVisibilityListener() {
    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
  }

  async function goOnline() {
    isOnline.value = true;
    await requestPermissions();
    await setupNotificationChannel();
    await startForegroundService();
    await acquireWakeLock();
    setupVisibilityListener();
    await startGeolocation();
    connectWebSocket();
  }

  async function goOffline() {
    isOnline.value = false;
    hasSentInitialLocation = false;
    stopHeartbeat();
    removeVisibilityListener();
    releaseWakeLock();

    if (ws) ws.close(1000, "Driver offline");
    ws = null;
    await stopForegroundService();
    await stopGeolocation();
  }

  onBeforeUnmount(() => {
    goOffline();
  });

  onMounted(() => {
    goOnline();
  });

  return {
    isOnline,
    isConnected,
    driver,
    lastLocation,
    goOnline,
    goOffline,
    handleChangeCity,
  };
}
