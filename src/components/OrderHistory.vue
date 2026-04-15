<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import CustomPagination from "./CustomPagination.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, CheckCircle } from "lucide-vue-next";

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
  Math.ceil(sumOfOrders.value / itemsPerPage.value)
);

async function getOrderHistory() {
  try {
    const res = await api.get(
      `/driver/${authStore.driver?.driver_id}?history=true&from=${fromDate.value}&to=${toDate.value}&page=${currentPage.value}`
    );

    orders.value = res.data.orders;
    deliveryCost.value = res.data.earnings.delivery_cost;
    sumOfOrders.value = res.data.earnings.sum_of_orders;
    sumOfOrderBasedDate.value = res.data.earnings.sum_of_orders_based_on_date;
  } catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
  }
}

function calcDriverCost(totalCost: number) {
  const basedPercentage = 0.15;
  const deduction = totalCost * basedPercentage;
  const total = totalCost - deduction;
  return total;
}

onMounted(async () => {
  await getOrderHistory();
});
</script>
<template>
  <div class="p-6 space-y-8" dir="rtl">
    <Card>
      <CardHeader>
        <CardTitle>بحث حسب التاريخ</CardTitle>
        <CardDescription
          >استعرض كل الطلبات بين التاريخين المحددين (صفحة {{ currentPage }} من
          {{ totalPages }})</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="flex flex-col md:flex-row gap-4 items-start">
          <div class="grid grid-cols-2 w-full gap-4">
            <div class="flex flex-col">
              <label class="text-sm font-medium mb-1">من تاريخ</label>
              <Input type="date" v-model="fromDate" />
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium mb-1">إلى تاريخ</label>
              <Input type="date" v-model="toDate" />
            </div>
          </div>
          <Button @click="getOrderHistory" :disabled="loading">
            <Loader2 v-if="loading" class="ml-2 h-4 w-4 animate-spin" />
            بحث
          </Button>
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">
            إجمالي ارباح التوصيل حسب التاريخ
          </CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-500">
            {{ calcDriverCost(deliveryCost) }} ج.م
          </div>
          <p class="text-xs text-muted-foreground">
            من {{ sumOfOrderBasedDate }} طلبات
          </p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>الطلبات</CardTitle>
        <CardDescription>
          استعرض كل الطلبات بين التاريخين المحددين
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <template v-for="order in orders" :key="order.id">
            <div class="border border-border rounded-lg p-4">
              <div class="flex items-start justify-between mb-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-primary"
                      >#{{ order.order_id }}</span
                    >
                  </div>
                  <p class="text-sm text-muted-foreground">
                    الربح :
                    {{ calcDriverCost(order.order_delivery_cost).toFixed(2) }}
                    ج.م
                  </p>
                </div>
                <span class="font-bold text-lg">
                  {{ order.order_total_price }} ج.م
                </span>
              </div>

              <div class="flex flex-col items-start text-start gap-4">
                <img
                  v-if="order.order_receipt"
                  :src="baseUrl + order.order_receipt"
                  alt="Receipt Image"
                  class="h-36 w-36 rounded-md object-cover"
                />

                <div class="w-full flex flex-col items-end" dir="ltr">
                  <p class="text-sm">
                    {{ order.restaurant_name }} : اسم المطعم
                  </p>
                  <p class="text-sm">
                    {{ order.restaurant_address }} : عنوان المطعم
                  </p>
                  <Separator class="my-2" />
                </div>
              </div>
            </div>
          </template>

          <div v-if="!loading && !orders.length" class="text-center py-8">
            <Clock class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">مافيش طلبات للفترة المحددة</p>
          </div>

          <div v-if="loading" class="flex justify-center py-8">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
          </div>
          <CustomPagination
            v-if="!loading && orders.length > 0"
            :current-page="currentPage"
            :total-items="sumOfOrders"
            :items-per-page="itemsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
