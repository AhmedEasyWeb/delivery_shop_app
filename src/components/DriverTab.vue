<script setup lang="ts">
import {
  CheckCircle,
  DollarSign,
  Star,
  PackageSearch,
  Loader2,
} from "lucide-vue-next";
import { Card, CardContent } from "./ui/card";
import { useAuthStore } from "@/stores/auth";
import DriverOrders from "@/components/DriverOrders.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useOrdersStore } from "@/stores/orders";
import api from "@/api/axios";

const authStore = useAuthStore();
const ordersStore = useOrdersStore();

const completedToday = ref(0);
const todayEarnings = ref(0);
const isLoading = ref(false);
const orders = computed(() => ordersStore.orders);

async function getDriverData() {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const res = await api.get(`/driver/${authStore.driver?.driver_id}`);
    completedToday.value = res.data.status.completedToday;
    todayEarnings.value = res.data.status.todayEarnings;
    ordersStore.orders = res.data.orders;
  } catch (err: any) {
    console.error("Failed to fetch driver data:", err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  getDriverData();
});

watch(
  () => orders.value.length,
  () => {
    getDriverData();
  },
);
</script>

<template>
  <div dir="rtl" class="space-y-6 pb-20">
    <div class="grid grid-cols-3 gap-3 px-4 pt-4">
      <Card class="border-none shadow-sm bg-primary/5">
        <CardContent class="p-3 flex flex-col items-center text-center">
          <div class="p-2 bg-primary/10 rounded-full mb-2">
            <DollarSign class="h-4 w-4 text-primary" />
          </div>
          <span class="text-[10px] text-gray-500 font-medium mb-1"
            >أرباح اليوم</span
          >
          <div class="text-lg font-bold text-primary leading-none">
            {{ todayEarnings.toFixed(2) }}
          </div>
        </CardContent>
      </Card>

      <Card class="border-none shadow-sm bg-green-50">
        <CardContent class="p-3 flex flex-col items-center text-center">
          <div class="p-2 bg-green-100 rounded-full mb-2">
            <CheckCircle class="h-4 w-4 text-green-600" />
          </div>
          <span class="text-[10px] text-gray-500 font-medium mb-1"
            >التوصيلات</span
          >
          <div class="text-lg font-bold text-green-600 leading-none">
            {{ completedToday }}
          </div>
        </CardContent>
      </Card>

      <Card class="border-none shadow-sm bg-yellow-50">
        <CardContent class="p-3 flex flex-col items-center text-center">
          <div class="p-2 bg-yellow-100 rounded-full mb-2">
            <Star class="h-4 w-4 text-yellow-600 fill-yellow-600" />
          </div>
          <span class="text-[10px] text-gray-500 font-medium mb-1"
            >التقييم</span
          >
          <div class="text-lg font-bold text-yellow-700 leading-none">
            {{ authStore.driver?.rate || "5.0" }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="px-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-extrabold text-gray-800">الطلبات القريبة</h2>
        <button
          @click="getDriverData"
          class="text-primary text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          تحديث
        </button>
      </div>

      <div
        v-if="orders.length === 0 && !isLoading"
        class="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100"
      >
        <div class="bg-gray-50 p-4 rounded-full mb-4">
          <PackageSearch class="h-10 w-10 text-gray-300" />
        </div>
        <h3 class="text-gray-500 font-bold">لا توجد طلبات حالياً</h3>
        <p class="text-gray-400 text-sm max-w-[200px] mt-1">
          تأكد أنك "متصل" وانتظر وصول طلبات جديدة في منطقتك.
        </p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-if="isLoading && orders.length === 0"
          class="flex justify-center py-10"
        >
          <Loader2 class="h-8 w-8 animate-spin text-primary/30" />
        </div>
        <DriverOrders
          v-for="order in orders"
          :key="order.order_id"
          :order="order"
          class="transition-all duration-300 animate-in fade-in slide-in-from-right-4"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transition for the stats cards */
.card {
  transition: transform 0.2s ease-in-out;
}
.card:active {
  transform: scale(0.98);
}
</style>
