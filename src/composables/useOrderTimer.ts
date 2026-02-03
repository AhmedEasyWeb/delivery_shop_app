import { onUnmounted, watch, type Ref } from "vue";
import type { Order } from "@/types";

function notifyUser(title: string, body: string) {
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

export function useOrderTimers(
  orders: Ref<Order[]>,
  sendWS: (data: any) => void
) {
  const timers = new Map<number, number>();

  function clearTimer(order_id: number) {
    if (timers.has(order_id)) {
      clearInterval(timers.get(order_id));
      timers.delete(order_id);
    }
  }

  function startTimers() {
    orders.value.forEach((order: any) => {
      const id = order.order_id;

      clearTimer(id);

      const interval = window.setInterval(() => {
        const now = Date.now();

        if (
          order.order_status === "delivered" ||
          order.order_status === "picked_up"
        ) {
          return;
        }

        if (order.order_status === "preparing") {
          const created = new Date(order.created_at).getTime();
          const passed = (now - created) / 60000;

          if (passed >= 21 && !order._late_preparing_sent) {
            sendWS({
              type: "late_preparing_order",
              order_id: order.order_id,
            });
            notifyUser(
              "إعداد الطلب يستغرق وقتا طويلا",
              `تم إخطار الإدارة برقم الطلب ${order.order_id} خذ ${passed} دقائق للتحضير`
            );
            order._late_preparing_sent = true;
          }
        }

        if (order.order_status === "ready") {
          const ready = new Date(order.ready_at).getTime();
          const passed = (now - ready) / 60000;

          if (passed >= 41 && !order._late_pickup_sent) {
            sendWS({
              type: "late_pickup_order",
              order_id: order.order_id,
            });
            notifyUser(
              "لم يتم استلام الطلب من قبل أي سائق منذ فترة طويلة",
              `سيتم إخطار الإدارة بهذا الأمر للمساعدة في أسرع وقت ممكن`
            );
            order._late_pickup_sent = true;
          }
        }
      }, 10000);

      timers.set(id, interval);
    });
  }

  function stopTimer(order_id: number) {
    clearTimer(order_id);
  }

  watch(
    orders,
    (newOrders) => {
      startTimers();

      timers.forEach((_, id) => {
        if (!newOrders.find((o) => o.order_id === id)) {
          clearTimer(id);
        }
      });
    },
    { deep: true, immediate: true }
  );

  onUnmounted(() => {
    timers.forEach((interval) => clearInterval(interval));
    timers.clear();
  });

  return { startTimers, stopTimer };
}
