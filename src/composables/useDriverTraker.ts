import { ref, onBeforeUnmount, onMounted, watch } from "vue";
import { registerPlugin } from "@capacitor/core";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import { toast } from "vue-sonner";
import { Capacitor } from "@capacitor/core";

// Import sub-composables (still used for permissions/notifications/geolocation)
import { useDriverNotifications } from "./useDriverNotifications";
import { useDriverForeground } from "./useDriverForeground";
import { useDriverGeolocation } from "./useDriverGeolocation";

// ── Native Plugin Interface ────────────────────────────────────────────────────
// This interface matches every @PluginMethod in DriverTrackerPlugin.java
interface DriverTrackerPlugin {
  goOnline(options: {
    driver_id: number;
    driver_name: string;
    driver_city: string;
    initial_lat: number | null;
    initial_lng: number | null;
  }): Promise<void>;
  goOffline(): Promise<void>;
  updateLocation(options: { lat: number; lng: number }): Promise<void>;
  updateOrdersList(options: {
    order_ids: number[];
    stationed_at: number | null;
  }): Promise<void>;
  sendUpdateOrders(options: {
    order_id: number;
    restaurant_id: number;
  }): Promise<void>;
  sendFreeDriver(): Promise<void>;
  changeCity(options: { city: string }): Promise<void>;
  addListener(
    event: "wsConnected" | "wsDisconnected" | "wsMessage",
    callback: (data: any) => void
  ): Promise<{ remove: () => void }>;
}

// Register the native plugin — maps to @CapacitorPlugin(name = "DriverTracker")
const NativeDriverTracker = registerPlugin<DriverTrackerPlugin>("DriverTracker");

export function useDriverTracker() {
  const authStore = useAuthStore();
  const ordersStore = useOrdersStore();
  const driver = authStore.driver;

  // ── State (same shape as before — UI doesn't change) ────────────────────────
  const isOnline = ref(false);
  const isConnected = ref(false);

  // Sub-composables (geolocation, notifications, foreground notification still JS-side)
  const {
    requestPermissions,
    setupNotificationChannel,
    showOrderNotification,
    showUpdateOrderNotification,
  } = useDriverNotifications();

  const { startService, stopService } = useDriverForeground();
  const { lastLocation, startTracking, stopTracking } = useDriverGeolocation();

  // Native event listener handles (for cleanup)
  let connectedHandle: { remove: () => void } | null = null;
  let disconnectedHandle: { remove: () => void } | null = null;
  let messageHandle: { remove: () => void } | null = null;

  // ── Native Event Listeners ───────────────────────────────────────────────────

  async function registerNativeListeners() {
    // wsConnected event from Java → DriverTrackerPlugin.notifyListeners("wsConnected")
    connectedHandle = await NativeDriverTracker.addListener(
      "wsConnected",
      () => {
        isConnected.value = true;
        console.log("✅ Native WS Connected");
      }
    );

    // wsDisconnected event — Java auto-reconnects; we just update UI state
    disconnectedHandle = await NativeDriverTracker.addListener(
      "wsDisconnected",
      () => {
        isConnected.value = false;
        console.log("❌ Native WS Disconnected — Java will reconnect...");
      }
    );

    // wsMessage event — same logic as old handleWsMessage()
    messageHandle = await NativeDriverTracker.addListener(
      "wsMessage",
      (data: any) => {
        handleWsMessage(data);
      }
    );
  }

  function removeNativeListeners() {
    connectedHandle?.remove();
    disconnectedHandle?.remove();
    messageHandle?.remove();
    connectedHandle = null;
    disconnectedHandle = null;
    messageHandle = null;
  }

  // ── Message Handler (identical logic to the original TS version) ─────────────

  function handleWsMessage(data: any) {
    if (data.type === "new_order_nearby") {
      showOrderNotification(data.order);
      NativeDriverTracker.sendUpdateOrders({
        order_id: data.order.order_id,
        restaurant_id: data.order.restaurant_id,
      });
      ordersStore.addOrder(data.order);
      authStore.setStationedAt(data.order.restaurant_id);
      toast.success("📦 طلب جديد قريب منك");
    }

    if (data.type === "new_orders_nearby") {
      if (data.orders?.length > 0) {
        showOrderNotification(data.orders[0]);
        data.orders.forEach((order: any) => {
          NativeDriverTracker.sendUpdateOrders({
            order_id: order.order_id,
            restaurant_id: order.restaurant_id,
          });
        });
        ordersStore.addOrders(data.orders);
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
        NativeDriverTracker.sendFreeDriver();
        return;
      }

      if (data.order) {
        ordersStore.updateOrder(data.order);
      } else {
        ordersStore.updateOrderStatus(orderId, orderStatus);
      }
    }
  }

  // ── Sync orders state from Pinia → Java ──────────────────────────────────────
  // Whenever orders change we tell Java so its location_update payloads stay accurate
  watch(
    () => ordersStore.orders,
    (orders) => {
      if (!isOnline.value) return;
      NativeDriverTracker.updateOrdersList({
        order_ids: orders.map((o) => o.order_id),
        stationed_at: authStore.driver?.stationed_at ?? null,
      });
    },
    { deep: true }
  );

  // ── Go Online / Offline ───────────────────────────────────────────────────────

  async function goOnline() {
    isOnline.value = true;

    const hasPerm = await requestPermissions();
    if (!hasPerm) {
      toast.error("يرجى تفعيل صلاحيات الموقع والاشعارات");
      isOnline.value = false;
      return;
    }

    await setupNotificationChannel();
    await startService();
    await registerNativeListeners();

    // ✅ Grab the current GPS position BEFORE connecting so driver_init
    // always includes a real location — even for a stationed driver who
    // never moves and whose background watcher never fires again.
    let initialLat: number | null = null;
    let initialLng: number | null = null;
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      initialLat = pos.coords.latitude;
      initialLng = pos.coords.longitude;
    } catch (err) {
      console.warn("⚠️ Could not get initial GPS position:", err);
      // We still connect — server will receive driver_init without location
    }

    // Connect WebSocket — passes initial location so driver_init is complete
    await NativeDriverTracker.goOnline({
      driver_id:   driver?.driver_id ?? -1,
      driver_name: driver?.driver_full_name ?? "",
      driver_city: driver?.driver_city ?? "",
      initial_lat: initialLat,
      initial_lng: initialLng,
    });

    // Start the background watcher in parallel — non-blocking.
    // Fires only when the driver moves more than the distanceFilter (~40m).
    // If driver is stationed this may never fire — the heartbeat keeps WS alive.
    startTracking((loc) => {
      NativeDriverTracker.updateLocation({ lat: loc.lat, lng: loc.lng });
    }).catch((err) => {
      console.warn("⚠️ GPS background watcher unavailable:", err);
      // WS stays alive regardless via Java heartbeat
    });
  }

  async function goOffline() {
    isOnline.value = false;
    isConnected.value = false;

    // Stop JS-side geolocation watcher
    await stopTracking();

    // Tell Java to close WebSocket and stop the service
    await NativeDriverTracker.goOffline();

    removeNativeListeners();
    await stopService();
  }

  // ── City Change ───────────────────────────────────────────────────────────────

  const handleChangeCity = (newCity: string) => {
    authStore.changeCity(newCity);
    NativeDriverTracker.changeCity({ city: newCity });
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  onMounted(() => {
    // Only auto-start on native Android; in browser keep old behavior
    if (Capacitor.isNativePlatform()) {
      goOnline();
    } else {
      goOnline(); // falls back gracefully on web too
    }
  });

  onBeforeUnmount(() => {
    goOffline();
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
