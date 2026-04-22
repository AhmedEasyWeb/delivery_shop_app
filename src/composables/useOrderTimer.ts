import { ref, watch, type Ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Order } from "@/types";

dayjs.extend(utc);

const trackedOrders = ref<any[]>([]);
let isGlobalTimerRunning = false;
let globalSendWS: ((data: any) => void) | null = null;

try {
  const cached = localStorage.getItem("delivery_shop_active_orders");
  if (cached) {
    trackedOrders.value = JSON.parse(cached);
  }
} catch (err) {
  console.error("Failed to parse cached active orders:", err);
}

watch(
  trackedOrders,
  (newVal) => {
    const active = newVal.filter(
      (o) => o.order_status !== "delivered" && o.order_status !== "picked_up",
    );
    localStorage.setItem("delivery_shop_active_orders", JSON.stringify(active));
  },
  { deep: true },
);

async function notifyUser(title: string, body: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: "beep.wav",
          },
        ],
      });
    } catch (err) {
      console.error("Native notification failed:", err);
    }
    return;
  }

  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

// Tick timers when app comes to foreground
if (Capacitor.isNativePlatform()) {
  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      console.log("📱 App resumed, checking order timers...");
      globalTick();
    }
  });
}


function globalTick() {
  const now = Date.now();

  trackedOrders.value.forEach((order) => {
    if (
      order.order_status === "delivered" ||
      order.order_status === "picked_up"
    ) {
      return;
    }

    if (order.order_status === "preparing") {
      const created = dayjs.utc(order.created_at).valueOf();
      const passed = (now - created) / 60000;

      if (passed >= 21 && !order._late_preparing_sent) {
        if (globalSendWS) {
          globalSendWS({
            type: "late_preparing_order",
            order_id: order.order_id,
          });
        }
        notifyUser(
          "إعداد الطلب يستغرق وقتا طويلا",
          `تم إخطار الإدارة برقم الطلب ${order.order_id} خذ ${passed.toFixed(1)} دقائق للتحضير`,
        );
        order._late_preparing_sent = true;
      }
    }

    if (order.order_status === "ready" && order.ready_at) {
      const ready = dayjs.utc(order.ready_at).valueOf();
      const passed = (now - ready) / 60000;

      if (passed >= 41 && !order._late_pickup_sent) {
        if (globalSendWS) {
          globalSendWS({
            type: "late_pickup_order",
            order_id: order.order_id,
          });
        }
        notifyUser(
          "لم يتم استلام الطلب من قبل أي سائق منذ فترة طويلة",
          `سيتم إخطار الإدارة بهذا الأمر للمساعدة في أسرع وقت ممكن`,
        );
        order._late_pickup_sent = true;
      }
    }
  });
}

function startGlobalTimer() {
  if (!isGlobalTimerRunning) {
    isGlobalTimerRunning = true;
    setInterval(globalTick, 10000);
  }
}

export function useOrderTimers(
  orders: Ref<Order[]>,
  sendWS: (data: any) => void,
) {
  globalSendWS = sendWS;

  startGlobalTimer();

  watch(
    orders,
    (newOrders) => {
      const newTrackedMap = new Map();

      for (const t of trackedOrders.value) {
        newTrackedMap.set(t.order_id, t);
      }

      trackedOrders.value = newOrders.map((o) => {
        const existing = newTrackedMap.get(o.order_id);
        if (existing) {
          return {
            ...o,
            _late_preparing_sent: existing._late_preparing_sent || false,
            _late_pickup_sent: existing._late_pickup_sent || false,
          };
        }
        return {
          ...o,
          _late_preparing_sent: false,
          _late_pickup_sent: false,
        };
      });
    },
    { deep: true, immediate: true },
  );

  function startTimers() {
    startGlobalTimer();
  }

  function stopTimer(order_id: number) {
    const target = trackedOrders.value.find((o) => o.order_id === order_id);
    if (target) {
      target.order_status = "delivered";
    }
  }

  return { startTimers, stopTimer };
}
