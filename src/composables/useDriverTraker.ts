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
    callback: (data: any) => void,
  ): Promise<{ remove: () => void }>;
}

// Register the native plugin — maps to @CapacitorPlugin(name = "DriverTracker")
const NativeDriverTracker =
  registerPlugin<DriverTrackerPlugin>("DriverTracker");

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
      },
    );

    // wsDisconnected event — Java auto-reconnects; we just update UI state
    disconnectedHandle = await NativeDriverTracker.addListener(
      "wsDisconnected",
      () => {
        isConnected.value = false;
        console.log("❌ Native WS Disconnected — Java will reconnect...");
      },
    );

    // wsMessage event — same logic as old handleWsMessage()
    messageHandle = await NativeDriverTracker.addListener(
      "wsMessage",
      (data: any) => {
        handleWsMessage(data);
      },
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
    console.log("📩 Received Native WS Message:", data);

    if (data.type === "new_order_nearby") {
      let order = data.order;
      if (typeof order === "string") {
        try { order = JSON.parse(order); } catch (e) { }
      }
      
      if (order) {
        const orderId = Number(order.order_id);
        const exists = ordersStore.orders.some(o => Number(o.order_id) === orderId);
        if (!exists) {
          order.order_id = orderId; // Ensure it's a number
          showOrderNotification(order);
          NativeDriverTracker.sendUpdateOrders({
            order_id: orderId,
            restaurant_id: Number(order.restaurant_id),
          });
          ordersStore.addOrder(order);
          authStore.setStationedAt(order.restaurant_id);
          toast.success("📦 طلب جديد قريب منك");
        }
      }
    }

    if (data.type === "new_orders_nearby") {
      let ordersArr = data.orders;
      if (typeof ordersArr === "string") {
        try { ordersArr = JSON.parse(ordersArr); } catch (e) { }
      }
      
      if (Array.isArray(ordersArr) && ordersArr.length > 0) {
        const newOrders = ordersArr.filter((order: any) => {
          const orderId = Number(order.order_id);
          order.order_id = orderId; // Normalize while filtering
          return !ordersStore.orders.some(o => Number(o.order_id) === orderId);
        });

        if (newOrders.length > 0) {
          showOrderNotification(newOrders[0]);
          newOrders.forEach((order: any) => {
            NativeDriverTracker.sendUpdateOrders({
              order_id: Number(order.order_id),
              restaurant_id: Number(order.restaurant_id),
            });
          });
          ordersStore.addOrders(newOrders);
          authStore.setStationedAt(newOrders[0].restaurant_id);
        }
      }
    }

    if (data.type === "updated_order" || data.type === "order_status_updated") {
      let orderId = Number(data.order_id || 0);
      let orderStatus = data.order_status;
      let orderData = data.order;

      // Handle stringified order data if it arrives that way
      if (typeof orderData === "string") {
        try {
          orderData = JSON.parse(orderData);
        } catch (e) {
          console.error("Failed to parse order data string:", e);
        }
      }

      // Extract info from order object if available
      if (orderData) {
        orderId = orderId || Number(orderData.order_id);
        orderStatus = orderStatus || orderData.order_status;
      }

      console.log(`🔄 Processing ${data.type}: ID=${orderId}, Status=${orderStatus}`);

      if (orderId && orderStatus) {
        if (orderStatus === "ready") {
          showUpdateOrderNotification(orderId);
        }

        if (orderStatus === "delivered" || orderStatus === "canceled") {
          ordersStore.removeOrder(orderId);
          NativeDriverTracker.sendFreeDriver();
          return;
        }

        // Apply updates
        if (orderData) {
          ordersStore.updateOrder(orderData);
        } else {
          ordersStore.updateOrderStatus(orderId, orderStatus);
        }
      }
    }
  }

  watch(
    () => ordersStore.orders,
    (orders) => {
      if (!isOnline.value) return;
      NativeDriverTracker.updateOrdersList({
        order_ids: orders.map((o) => o.order_id),
        stationed_at: authStore.driver?.stationed_at ?? null,
      });
    },
    { deep: true },
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
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      initialLat = pos.coords.latitude;
      initialLng = pos.coords.longitude;
    } catch (err) {
      console.warn("⚠️ Could not get initial GPS position:", err);
      // We still connect — server will receive driver_init without location
    }

    // Connect WebSocket — passes initial location so driver_init is complete
    await NativeDriverTracker.goOnline({
      driver_id: driver?.driver_id ?? -1,
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
