import { ref } from "vue";
import { defineStore } from "pinia";
import { toast } from "vue-sonner";

interface Order {
  order_id: number;
  order_status: string;
  [key: string]: any;
}

export const useOrdersStore = defineStore("orders", () => {
  const orders = ref<Order[]>([]);

  function addOrder(order: Order) {
    orders.value.unshift(order);
    toast.success("تم إضافة طلب جديد");
  }

  function removeOrder(orderId: number) {
    orders.value = orders.value.filter((order) => order.order_id !== orderId);
    toast.warning("تم حذف الطلب");
  }

  function updateOrder(updatedOrder: Order) {
    const index = orders.value.findIndex(
      (o) => o.order_id === updatedOrder.order_id
    );

    if (index !== -1) {
      orders.value = orders.value.map((order) =>
        order.order_id === updatedOrder.order_id
          ? { ...order, ...updatedOrder }
          : order
      );
      toast.warning("تم تحديث الطلب");
    } else {
      toast.error("الطلب غير موجود");
    }
  }

  function updateOrderStatus(orderId: number, status: string) {
    const index = orders.value.findIndex((o) => o.order_id === orderId);

    if (index !== -1) {
      orders.value = orders.value.map((order) =>
        order.order_id === orderId ? { ...order, order_status: status } : order
      );
      toast.info("تم تحديث حالة الطلب");
    } else {
      toast.error("الطلب غير موجود");
    }
  }

  return {
    orders,
    addOrder,
    removeOrder,
    updateOrder,
    updateOrderStatus,
  };
});
