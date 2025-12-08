<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";

import { toast } from "vue-sonner";
import { Clock, Package, Truck, Pen } from "lucide-vue-next";
import { h } from "vue";
import { httpRequest } from "@/utils/http";
import baseUrl from "@/utils/baseUrl";

defineProps<{
  order: Order;
}>();

const emits = defineEmits<{
  (e: "edit-click", order: Order, open: boolean): void;
}>();

const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
  httpRequest({
    url: `/api/orders/${orderId}?update_status=true`,
    method: "PUT",
    data: { order_status: newStatus },
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
  cost: number
) => {
  const newCost = order.order_delivery_cost + cost;
  httpRequest({
    url: `/api/orders/${orderId}`,
    method: "PUT",
    data: {
      order_total_price: order.order_total_price,
      order_delivery_cost: newCost,
      notes: order.order_notes,
      restaurant_id: order.restaurant_id,
    },
  })
    .then((_) => {
      toast.success("تم تحديث تكلفة التوصيل بنجاح!");
    })
    .catch((_) => {
      toast.error("فشل في تحديث تكلفة التوصيل.");
    });
};

function getStatusIcon(status: string) {
  switch (status) {
    case "preparing":
      return h(Clock, { class: "h-4 w-4" });
    case "ready":
      return h(Package, { class: "h-4 w-4" });
    case "picked-up":
      return h(Truck, { class: "h-4 w-4" });
    default:
      return h(Clock, { class: "h-4 w-4" });
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "preparing":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "ready":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "picked-up":
      return "bg-primary/10 text-primary border-primary/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getStatus(status: string) {
  switch (status) {
    case "preparing":
      return "في التحضير";
    case "ready":
      return "جاهز للاستلام";
    case "picked-up":
      return "تم الاستلام";
    case "delivered":
      return "تم التوصيل";
    default:
      return "في التحضير";
  }
}
</script>
<template>
  <div class="border border-border rounded-lg p-4">
    <div class="flex items-start justify-between mb-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
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
        </div>
        <p class="text-sm text-muted-foreground">
          {{ order.created_at.replace("T", " ").split(".")[0] }}
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
        :src="baseUrl + order.order_receipt"
        alt="Receipt Image"
        class="h-36 w-36 rounded-md object-cover mr-2"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p class="font-medium">{{ order.user_name }} : الاسم</p>
        <p class="text-sm text-muted-foreground">
          {{ order.user_phone }} : التليفون
        </p>
        <p class="text-sm text-muted-foreground">
          {{ order.user_address }} : العنوان
        </p>
      </div>
      <div>
        <p class="font-medium">ملاحظات</p>
        <p class="text-sm text-muted-foreground">
          {{ order.order_notes }}
        </p>
      </div>
    </div>

    <div class="flex gap-2">
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
    </div>
    <div
      v-if="order.order_status !== 'delivered'"
      class="flex flex-col space-y-2"
    >
      <span>إضافة علي التوصيل</span>
      <div class="bonus btns space-x-1 md:space-x-2">
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
