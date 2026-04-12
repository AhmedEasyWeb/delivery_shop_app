<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import CustomPagination from "./CustomPagination.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Loader2,
  CheckCircle,
  Search,
  Calendar,
  Store,
  MapPin,
  ReceiptText,
} from "lucide-vue-next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import Separator from "./ui/separator/Separator.vue";
import baseUrl from "@/utils/baseUrl";
import api from "@/api/axios";

const loading = ref(false);
const fromDate = ref(new Date().toISOString().split("T")[0]);
const toDate = ref(new Date().toISOString().split("T")[0]);
const deliveryCost = ref(0);
const sumOfOrders = ref(0);
const sumOfOrderBasedDate = ref(0);

const authStore = useAuthStore();
const orders = ref<any>([]);

const currentPage = ref(1);
const itemsPerPage = ref(50);

const totalPages = computed(() =>
  Math.ceil(sumOfOrders.value / itemsPerPage.value),
);

async function getOrderHistory() {
  loading.value = true;
  try {
    const res = await api.get(
      `/driver/${authStore.driver?.driver_id}?history=true&from=${fromDate.value}&to=${toDate.value}&page=${currentPage.value}`,
    );

    orders.value = res.data.orders;
    deliveryCost.value = res.data.earnings.delivery_cost;
    sumOfOrders.value = res.data.earnings.sum_of_orders;
    sumOfOrderBasedDate.value = res.data.earnings.sum_of_orders_based_on_date;
  } catch (err) {
    toast.error("حدث خطأ أثناء تحميل السجل");
  } finally {
    loading.value = false;
  }
}

function calcDriverCost(totalCost: number) {
  const basedPercentage = 0.15;
  const deduction = totalCost * basedPercentage;
  return totalCost - deduction;
}

onMounted(() => getOrderHistory());

watch(currentPage, () => getOrderHistory());
</script>

<template>
  <div class="p-4 space-y-6 pb-20" dir="rtl">
    <Card class="border-none shadow-sm overflow-hidden">
      <div
        class="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center gap-2"
      >
        <Calendar class="h-4 w-4 text-primary" />
        <span class="text-sm font-bold text-primary">البحث في السجل</span>
      </div>
      <CardContent class="p-4">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-400 mr-1"
                >من تاريخ</label
              >
              <Input
                type="date"
                v-model="fromDate"
                class="bg-gray-50 border-none shadow-none focus-visible:ring-1"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-400 mr-1"
                >إلى تاريخ</label
              >
              <Input
                type="date"
                v-model="toDate"
                class="bg-gray-50 border-none shadow-none focus-visible:ring-1"
              />
            </div>
          </div>
          <Button
            @click="getOrderHistory"
            :disabled="loading"
            class="w-full shadow-md"
          >
            <Loader2 v-if="loading" class="ml-2 h-4 w-4 animate-spin" />
            <Search v-else class="ml-2 h-4 w-4" />
            بحث وتحديث
          </Button>
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-4">
      <Card
        class="bg-green-600 text-white border-none shadow-lg relative overflow-hidden"
      >
        <CardContent class="p-6">
          <CheckCircle
            class="absolute -left-4 -bottom-4 h-24 w-24 text-white/10 rotate-12"
          />
          <p class="text-sm font-medium text-green-100 mb-1">
            صافي أرباح التوصيل
          </p>
          <div class="text-3xl font-black">
            {{ calcDriverCost(deliveryCost).toFixed(2) }}
            <span class="text-lg font-normal">ج.م</span>
          </div>
          <div
            class="mt-4 flex items-center gap-2 text-xs bg-black/10 w-fit px-2 py-1 rounded"
          >
            إجمالي التوصيلات: {{ sumOfOrderBasedDate }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h2 class="font-black text-gray-800">تفاصيل الطلبات</h2>
        <span class="text-xs text-gray-400"
          >صفحة {{ currentPage }} من {{ totalPages || 1 }}</span
        >
      </div>

      <template v-if="!loading && orders.length">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded"
                  >#{{ order.order_id }}</span
                >
                <span class="text-[10px] text-gray-400 font-medium">{{
                  order.created_at || "مكتمل"
                }}</span>
              </div>
              <p class="text-xs font-bold text-green-600">
                ربحك:
                {{ calcDriverCost(order.order_delivery_cost).toFixed(2) }} ج.م
              </p>
            </div>
            <div class="text-left">
              <p class="text-lg font-black text-gray-900 leading-none">
                {{ order.order_total_price }}
                <span class="text-[10px]">ج.م</span>
              </p>
              <p class="text-[10px] text-gray-400 mt-1">القيمة الإجمالية</p>
            </div>
          </div>

          <div class="flex gap-4 items-center bg-gray-50 p-3 rounded-xl">
            <div v-if="order.order_receipt" class="shrink-0 relative">
              <img
                :src="baseUrl + order.order_receipt"
                alt="Receipt"
                class="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
              <div
                class="absolute -top-1 -right-1 bg-white p-0.5 rounded-full shadow"
              >
                <ReceiptText class="h-3 w-3 text-primary" />
              </div>
            </div>

            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <Store class="h-3 w-3 text-gray-400" />
                <p class="text-xs font-bold text-gray-700 leading-none">
                  {{ order.restaurant_name }}
                </p>
              </div>
              <div class="flex items-start gap-2">
                <MapPin class="h-3 w-3 text-gray-400 mt-0.5" />
                <p class="text-[11px] text-gray-500 leading-tight">
                  {{ order.restaurant_address }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!loading && !orders.length" class="text-center py-16">
        <div
          class="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Clock class="h-10 w-10 text-gray-300" />
        </div>
        <p class="font-bold text-gray-500">لا توجد سجلات</p>
        <p class="text-xs text-gray-400">جرب اختيار نطاق تاريخ مختلف</p>
      </div>

      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="h-32 bg-gray-100 animate-pulse rounded-2xl"
        ></div>
      </div>

      <CustomPagination
        v-if="!loading && orders.length > 0"
        :current-page="currentPage"
        :total-items="sumOfOrders"
        :items-per-page="itemsPerPage"
        @update:current-page="currentPage = $event"
        class="pt-4"
      />
    </div>
  </div>
</template>
