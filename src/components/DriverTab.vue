<script setup lang="ts">
import { CheckCircle, DollarSign, Star } from "lucide-vue-next";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useAuthStore } from "@/stores/auth";
import DriverOrders from "@/components/DriverOrders.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useOrdersStore } from "@/stores/orders";
import api from "@/api/axios";

const authStore = useAuthStore();
const ordersStore = useOrdersStore();

const completedToday = ref(0);
const todayEarnings = ref(0);
const orders = computed(() => ordersStore.orders);

async function getDriverData() {
  try {
    const res = await api.get(`/driver/${authStore.driver?.driver_id}`);

    completedToday.value = res.data.status.completedToday;
    todayEarnings.value = res.data.status.todayEarnings;
    ordersStore.orders = res.data.orders;
  } catch (err: any) {
    console.error("Failed to fetch driver data:", err);
  }
}

onMounted(async () => {
  await getDriverData();
});

watch(
  () => orders.value.length,
  async () => {
    await getDriverData();
  }
);
</script>
<template>
  <div class="p-6">
    <div dir="rtl" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">أرباح اليوم</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-primary">
            {{ todayEarnings.toFixed(2) }}
          </div>
          <p class="text-xs text-muted-foreground">
            من {{ completedToday }} توصيلات
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">التوصيلات</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-500">
            {{ completedToday }}
          </div>
          <p class="text-xs text-muted-foreground">اكتملت اليوم</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">التقييم</CardTitle>
          <Star class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            dir="ltr"
            class="text-2xl font-bold flex items-center gap-1 w-full justify-end"
          >
            {{ authStore.driver?.rate || 0.0 }}
            <Star class="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">الطلبات القريبة</h2>

    <div v-if="orders.length === 0" class="text-gray-400">
      لا توجد طلبات حالياً
    </div>

    <div v-else>
      <DriverOrders
        v-for="order in orders"
        :key="order.order_id"
        :order="order"
      />
    </div>
  </div>
</template>
