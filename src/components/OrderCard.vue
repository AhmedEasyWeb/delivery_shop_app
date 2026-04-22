<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { toast } from "vue-sonner";
import { Pen, MapPin } from "lucide-vue-next";
import {
  getPaymentMethod,
  getStatus,
  getStatusColor,
  getStatusIcon,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const props = defineProps<{
  order: Order;
}>();

const emits = defineEmits<{
  (e: "edit-click", order: Order, open: boolean): void;
  (e: "show-driver-location", driverId: number): void;
}>();

const authStore = useAuthStore();

const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
  api
    .put(`/orders/${orderId}?update_status=true`, {
      order_status: newStatus,
      restaurant_id: authStore.user.id,
    })
    .then((_) => {
      toast.success("تم تحديث حالة الطلب بنجاح!");
    })
    .catch((_) => {
      toast.error("فشل في تحديث حالة الطلب.");
    });
};

const handleEditClick = (order: Order, open: boolean) => {
  if (open) {
    emits("edit-click", order, open);
  }
};

const handleUpdateDeliveryCost = (
  orderId: number,
  order: Order,
  cost: number,
) => {
  const newCost = order.order_delivery_cost + cost;
  api
    .put(`/orders/${orderId}`, {
      order_total_price: order.order_total_price,
      order_delivery_cost: newCost,
      notes: order.order_notes,
      restaurant_id: order.restaurant_id,
    })
    .then((_) => {
      toast.success("تم تحديث تكلفة التوصيل بنجاح!");
    })
    .catch((_) => {
      toast.error("فشل في تحديث تكلفة التوصيل.");
    });
};
</script>
<template>
  <div class="border border-border rounded-lg p-4">
    <div class="flex items-start justify-between mb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-bold text-primary">#{{ order.order_id }}</span>
          <Badge :class="getStatusColor(order.order_status)">
            <component
              :is="getStatusIcon(order.order_status)"
              class="h-3 w-3"
            />
            <span class="ml-1 capitalize">
              {{ getStatus(order.order_status) }}
            </span>
          </Badge>
          <Badge
            v-if="order.driver_id"
            class="bg-blue-500/20 text-blue-600 border-blue-500/30"
          >
            تم تعيين سائق
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ order.created_at.replace("T", " ").split(".")[0] }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ getPaymentMethod(order.payment_method) }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span class="font-bold text-lg">
          {{ order.order_total_price }} ج.م
        </span>

        <span class="font-bold text-lg">
          {{ order.order_delivery_cost }} ج.م
        </span>
      </div>
    </div>

    <div class="order-items">
      <img
        :src="'https://deliveryshop.cloud' + order.order_receipt"
        alt="Receipt Image"
        class="h-36 w-36 rounded-md object-cover mr-2"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p class="font-medium">ملاحظات</p>
        <p class="text-sm text-muted-foreground">
          {{ order.order_notes }}
        </p>
      </div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <Button
        v-if="order.order_status === 'preparing'"
        size="sm"
        class="bg-green-600 hover:bg-green-700"
        @click="handleUpdateOrderStatus(order.order_id, 'ready')"
      >
        جاهز للاستلام
      </Button>

      <Button
        v-if="order.order_status !== 'delivered'"
        size="sm"
        class="bg-blue-600 hover:bg-blue-700"
        @click="handleEditClick(order, true)"
      >
        <Pen class="h-4 w-4 mr-2" />
        تعديل
      </Button>

      <Button
        v-if="order.driver_id"
        size="sm"
        variant="outline"
        class="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
        @click="emits('show-driver-location', order.driver_id!)"
      >
        <MapPin class="h-4 w-4 mr-2" />
        موقع السائق
      </Button>
    </div>
    <div class="flex flex-col space-y-2">
      <span>إضافة علي التوصيل</span>
      <div
        v-if="order.order_status !== 'delivered'"
        class="bonus btns space-x-1 md:space-x-2"
      >
        <Button @click="handleUpdateDeliveryCost(order.order_id, order, 5)"
          >+5 ج.م</Button
        >
        <Button @click="handleUpdateDeliveryCost(order.order_id, order, 10)"
          >+10 ج.م</Button
        >
        <Button @click="handleUpdateDeliveryCost(order.order_id, order, 15)"
          >+15 ج.م</Button
        >
      </div>
    </div>
  </div>
</template>
