<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import RestaurantsHeader from "@/components/RestaurantsHeader.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, CheckCircle } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import api from "@/api/axios";
import type { Order } from "@/types";
import { toast } from "vue-sonner";
import CustomPagination from "@/components/CustomPagination.vue";
import { getStatusColor, getStatusIcon } from "@/lib/utils";

const orders = ref<Order[]>([]);
const loading = ref(false);
const error = ref("");
const status = ref<any>({});
const fromDate = ref("");
const toDate = ref("");

const currentPage = ref(1);
const itemsPerPage = ref(50);

const totalPages = computed(() =>
  Math.ceil(status.value.sum_of_orders / itemsPerPage.value),
);

const fetchOrdersByDate = async () => {
  if (!fromDate.value || !toDate.value) {
    toast.warning("اختار تاريخ البداية والنهاية الأول");
    return;
  }
  loading.value = true;

  try {
    const res = await api.get(
      `/orders?from=${fromDate.value}&to=${toDate.value}&page=${currentPage.value}`,
    );
    orders.value = res.data.orders || [];
  } catch (err: any) {
    error.value = err.message || "فشل في جلب الطلبات";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await api.get(
      `/orders?from=${fromDate.value}&to=${toDate.value}&status=true&page=${currentPage.value}`,
    );
    status.value = res.data.stats || {};
    console.log("Status:", res.data.stats);
  } catch (err: any) {
    console.error("Failed to fetch stats:", err);
  }
};

onMounted(async () => {
  const today = new Date().toISOString().split("T")[0];
  fromDate.value = today!;
  toDate.value = today!;
  await fetchOrdersByDate();
  await fetchStats();
});

watch(currentPage, async (newPage, oldPage) => {
  if (newPage !== oldPage) {
    await fetchOrdersByDate();
  }
});
</script>

<template>
  <RestaurantsHeader />

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
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1">من تاريخ</label>
            <Input type="date" v-model="fromDate" />
          </div>
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1">إلى تاريخ</label>
            <Input type="date" v-model="toDate" />
          </div>
          <Button @click="fetchOrdersByDate" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
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
          <CardTitle class="text-sm font-medium">عدد الطلبات</CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-primary">
            {{ status.sum_of_orders }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">
            عدد الطلبات المكتملة
          </CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-500">
            {{ status.sum_of_completed_orders }}
          </div>
          <p class="text-xs text-muted-foreground">طلبات تم تسليمها</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>الطلبات</CardTitle>
        <CardDescription
          >استعرض كل الطلبات بين التاريخين المحددين</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <template v-for="order in orders" :key="order.order_id">
            <div class="border border-border rounded-lg p-4">
              <div class="flex items-start justify-between mb-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-primary"
                      >#{{ order.order_id }}</span
                    >
                    <Badge :class="getStatusColor(order.order_status)">
                      <component
                        :is="getStatusIcon(order.order_status)"
                        class="h-3 w-3"
                      />
                      <span class="ml-1 capitalize">
                        {{ order.order_status.replace("-", " ") }}
                      </span>
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {{ order.created_at }}
                  </p>
                </div>
                <span class="font-bold text-lg"
                  >{{ order.order_total_price }} ج.م</span
                >
              </div>

              <div class="flex flex-wrap gap-4">
                <img
                  v-if="order.order_receipt"
                  :src="'https://deliveryshop.cloud' + order.order_receipt"
                  alt="Receipt Image"
                  class="h-36 w-36 rounded-md object-cover"
                />
                <div>
                  <p class="font-medium">{{ order.user_name }} : الاسم</p>
                  <p class="text-sm text-muted-foreground">
                    {{ order.user_phone }} : التليفون
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ order.user_address }} : العنوان
                  </p>
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
            :total-items="status.sum_of_orders"
            :items-per-page="itemsPerPage"
            @update:current-page="currentPage = $event"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
