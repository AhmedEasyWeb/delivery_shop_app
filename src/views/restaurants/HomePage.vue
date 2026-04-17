<script setup lang="ts">
import EditOrders from "@/components/EditOrders.vue";
import RestaurantDriverMap from "@/components/RestaurantDriverMap.vue";
import { computed, onMounted, ref, watch } from "vue";
import { Clock, CheckCircle, MessageCircle } from "lucide-vue-next";
import Header from "@/components/Header.vue";
import OrderCard from "@/components/OrderCard.vue";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useWebSocket } from "@/composables/useWebSocket";
import api from "@/api/axios";
import type { Order } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { toast } from "vue-sonner";
import CustomPagination from "@/components/CustomPagination.vue";
import { useOrderTimers } from "@/composables/useOrderTimer";

const auth = useAuthStore();
const completedToday = ref(0);
const waitingOrders = ref<Order[]>([]);
const orders = ref<Order[]>([]);
const loading = ref(false);
const error = ref("");
const editDialogOpen = ref(false);
const selectedOrder = ref<Order>({} as Order);
const status = ref<any>({});
const showDriverMap = ref(false);
const selectedDriverId = ref<number | null>(null);

const handleShowDriverLocation = (driverId: number) => {
  selectedDriverId.value = driverId;
  showDriverMap.value = true;
};

const { messages, sendMessage } = useWebSocket(auth.user?.restaurant_id || 0);

const currentPage = ref(1);
const itemsPerPage = ref(50);

const totalPages = computed(() =>
  Math.ceil((status.value.sum_of_orders || 0) / itemsPerPage.value),
);

const fetchTodayOrders = async () => {
  loading.value = true;
  const date = new Date();
  const today = date.toISOString().split("T")[0];

  try {
    const res = await api.get(`/orders?from=${today}&to=${today}`);
    orders.value = res.data.orders || [];
  } catch (err: any) {
    error.value = err.message || "Failed to fetch orders";
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  loading.value = true;
  const date = new Date();
  const today = date.toISOString().split("T")[0];

  try {
    const res = await api.get(
      `/orders?from=${today}&to=${today}&status=true&page=${currentPage.value}`,
    );
    status.value = res.data.stats || {};
  } catch (err: any) {
    console.error("Failed to fetch stats:", err);
  } finally {
    loading.value = false;
  }
};

const { startTimers } = useOrderTimers(orders, sendMessage);

onMounted(async () => {
  await fetchTodayOrders();
  await fetchStats();
  startTimers();
});

let processedMessagesCount = 0;

watch(
  () => messages.value.length,
  (newLength) => {
    if (newLength === 0) {
      processedMessagesCount = 0;
      return;
    }

    for (let i = processedMessagesCount; i < newLength; i++) {
      const msg = messages.value[i];
      if (!msg) continue;

      if (msg.type === "new_order" && msg.order) {
        toast.success("تم انشاء طلب جديد!");
        if (!orders.value.find((o) => o.order_id === msg.order.order_id)) {
          orders.value = [msg.order, ...orders.value];
        }
      }

      if (msg.type === "updated_order" && msg.order) {
        toast.success(`تم تحديث بيانات الطلب رقم ${msg.order.order_id}`);
        orders.value = orders.value.map((order) =>
          order.order_id === msg.order.order_id
            ? { ...order, ...msg.order }
            : order,
        );
      }

      if (msg.type === "order_status_updated" && msg.order) {
        toast.info(
          `تغيرت حالة الطلب رقم ${msg.order.order_id} إلى: ${msg.order.order_status}`,
        );
        orders.value = orders.value.map((order) =>
          order.order_id === msg.order.order_id
            ? { ...order, order_status: msg.order.order_status }
            : order,
        );
      }
    }

    processedMessagesCount = newLength;
  },
  { immediate: true },
);

watch(
  orders,
  (newOrders) => {
    waitingOrders.value = newOrders.filter(
      (order: any) => order.order_status !== "delivered",
    );

    completedToday.value = newOrders.filter(
      (order: any) => order.order_status === "delivered",
    ).length;
  },
  { immediate: true, deep: true },
);

function redirectToWhatsApp(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  window.open(whatsappUrl, "_blank");
}
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
            @show-driver-location="handleShowDriverLocation"
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
  <RestaurantDriverMap
    v-model="showDriverMap"
    :driverId="selectedDriverId"
    :messages="messages"
    :sendMessage="sendMessage"
  />

  <!-- WhatsApp Support Button -->
  <button
    @click="redirectToWhatsApp('+201214555193')"
    class="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#128C7E] active:scale-95 transition-all outline-none"
  >
    <MessageCircle class="h-5 w-5" />
    <span class="font-medium text-sm">تواصل مع الدعم</span>
  </button>
</template>
