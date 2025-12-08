<script setup lang="ts">
import EditOrders from "@/components/EditOrders.vue";
import { computed, onMounted, ref, watch } from "vue";
import { Clock, CheckCircle } from "lucide-vue-next";
import Header from "@/components/RestaurantsHeader.vue";
import OrderCard from "@/components/OrderCard.vue";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useWebRestaurantSocket } from "@/composables/useWebSocket";

import type { Order } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { toast } from "vue-sonner";
import CustomPagination from "@/components/CustomPagination.vue";
import { httpRequest } from "@/utils/http";

const auth = useAuthStore();

const orders = ref<Order[]>([]);
const waitingOrders = ref<Order[]>([]);
const completedToday = ref(0);
const status = ref<any>({});
const loading = ref(false);
const error = ref("");

const currentPage = ref(1);
const itemsPerPage = ref(50);
const totalPages = computed(() =>
  Math.ceil(status.value.sum_of_orders / itemsPerPage.value)
);

const editDialogOpen = ref(false);
const selectedOrder = ref<Order>({} as Order);

let socket: ReturnType<typeof useWebRestaurantSocket> | null = null;

const fetchTodayOrders = async () => {
  loading.value = true;
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await httpRequest<{ orders: Order[] }>({
      url: `/api/orders?from=${today}&to=${today}`,
      method: "GET",
    });
    orders.value = res.orders;
  } catch (err: any) {
    toast.error("فشل في جلب طلبات اليوم: " + (err.message || "خطأ غير معروف"));
    error.value = err.message || "Failed to fetch orders";
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  loading.value = true;
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await httpRequest<{ stats: any }>({
      url: `/api/orders?from=${today}&to=${today}&status=true&page=${currentPage.value}`,
      method: "GET",
    });
    status.value = res.stats || {};
  } catch (err: any) {
    toast.error("فشل في جلب الإحصائيات: " + (err.message || "خطأ غير معروف"));
    console.error("Failed to fetch stats:", err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => auth.user,
  (user) => {
    if (user?.id) {
      console.log(`Initializing WebSocket for restaurant ID: ${user.id}`);
      socket = useWebRestaurantSocket(user.id, user.location);
    }
  },
  { immediate: true }
);

watch(
  () => socket?.messages.value,
  (newMessages) => {
    if (!newMessages?.length) return;
    const last = newMessages[newMessages.length - 1];
    if (!last) return;

    console.log("WebSocket message received:", last);

    if (last.type === "new_order") {
      toast.success("تم انشاء طلب جديد!");
      orders.value.push(last.order);
    }

    if (last.type === "updated_order") {
      orders.value = orders.value.map((order) =>
        order.order_id === last.order.order_id
          ? Object.assign(order, last.order)
          : order
      );
    }

    if (last.type === "order_status_updated") {
      orders.value = orders.value.map((order) =>
        order.order_id === last.order.order_id
          ? { ...order, order_status: last.order.order_status }
          : order
      );
    }
  },
  { immediate: true, deep: true }
);

watch(
  orders,
  (newOrders) => {
    waitingOrders.value = newOrders.filter(
      (order) => order.order_status !== "delivered"
    );

    completedToday.value = newOrders.filter(
      (order) => order.order_status === "delivered"
    ).length;
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  fetchTodayOrders();
  fetchStats();
});
</script>
<template>
  <Header />
  <div class="p-6" dir="rtl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">طلبات قيد الانتظار</CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-primary">
            {{ waitingOrders.length }}
          </div>
          <p class="text-xs text-muted-foreground">محتاجة متابعة</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">تم تسليمها النهارده</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-500">
            {{ completedToday }}
          </div>
          <p class="text-xs text-muted-foreground">طلبات تم تسليمها</p>
        </CardContent>
      </Card>
    </div>

    <p class="mb-4 text-sm text-muted-foreground">
      استعرض كل الطلبات بين التاريخين المحددين (صفحة {{ currentPage }} من
      {{ totalPages }})
    </p>

    <Card>
      <CardHeader>
        <CardTitle>الطلبات الحالية</CardTitle>
        <CardDescription>
          تابع الطلبات اللي شغالة دلوقتي وعدّل حالتها
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div class="space-y-4">
          <OrderCard
            v-for="order in waitingOrders"
            :order="order"
            :key="order.order_id"
            @edit-click="
              (order: Order, open: boolean) => {
                selectedOrder = order;
                editDialogOpen = open;
              }
            "
          />

          <div v-if="!orders.length" class="text-center py-8">
            <Clock class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">مافيش طلبات شغالة دلوقتي</p>
            <p class="text-sm text-muted-foreground">أي طلب جديد هيظهر هنا</p>
          </div>
          <CustomPagination
            v-if="!loading && orders.length > 0"
            :current-page="currentPage"
            :total-items="status.sum_of_orders"
            :items-per-page="itemsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>
      </CardContent>
    </Card>
  </div>
  <EditOrders v-model:open="editDialogOpen" :order="selectedOrder" />
</template>
