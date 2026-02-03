<script setup lang="ts">
import { Wallet, CheckCircle2, Star, TrendingUp, Radar } from "lucide-vue-next";
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
  },
);
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-10" dir="rtl">
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-black text-slate-900 mr-2">ملخص النشاط</h2>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card
          class="col-span-2 md:col-span-1 border-none shadow-sm bg-slate-900 text-white rounded-[28px] overflow-hidden"
        >
          <CardContent class="p-5 relative">
            <div class="bg-white/10 p-2 rounded-xl absolute left-4 top-5">
              <Wallet class="h-5 w-5 text-white" />
            </div>
            <p class="text-sm font-bold text-slate-300">أرباح اليوم</p>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="text-3xl font-black">{{
                todayEarnings.toFixed(2)
              }}</span>
              <span class="text-xs font-bold text-slate-400">ج.م</span>
            </div>
            <div
              class="mt-4 flex items-center gap-1.5 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/10"
            >
              <TrendingUp class="w-3 h-3 text-emerald-400" />
              <p class="text-[10px] font-bold text-slate-200">
                من {{ completedToday }} توصيلات
              </p>
            </div>
          </CardContent>
        </Card>

        <Card class="border-none shadow-sm rounded-[28px] bg-white">
          <CardContent class="p-5">
            <div
              class="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            >
              <CheckCircle2 class="h-6 w-6 text-emerald-600" />
            </div>
            <p class="text-xs font-bold text-slate-500">توصيلات اليوم</p>
            <div class="text-2xl font-black text-slate-900 mt-1">
              {{ completedToday }}
            </div>
          </CardContent>
        </Card>

        <Card class="border-none shadow-sm rounded-[28px] bg-white">
          <CardContent class="p-5">
            <div
              class="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            >
              <Star class="h-6 w-6 text-amber-500 fill-amber-500" />
            </div>
            <p class="text-xs font-bold text-slate-500">التقييم العام</p>
            <div
              class="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1"
            >
              {{ authStore.driver?.rate || "5.0" }}
              <span class="text-[10px] text-slate-400">/5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="px-4 mt-4">
      <div class="flex items-center justify-between mb-4 px-2">
        <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
          الطلبات القريبة
          <span
            v-if="orders.length > 0"
            class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"
          ></span>
        </h2>
        <span
          class="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full"
          >مباشر الآن</span
        >
      </div>

      <div
        v-if="orders.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div class="bg-slate-100 p-6 rounded-full mb-4">
          <Radar class="w-12 h-12 text-slate-300 animate-spin-slow" />
        </div>
        <p class="text-slate-500 font-bold text-lg">لا توجد طلبات حالياً</p>
        <p class="text-slate-400 text-sm mt-1">
          بمجرد توفر طلبات في منطقتك ستظهر هنا
        </p>
      </div>

      <div v-else class="space-y-4">
        <DriverOrders
          v-for="order in orders"
          :key="order.order_id"
          :order="order"
          class="transition-all active:scale-[0.98]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
