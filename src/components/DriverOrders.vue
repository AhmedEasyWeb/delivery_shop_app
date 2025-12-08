<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
import { Browser } from "@capacitor/browser";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Navigation,
  Phone,
  Package,
  Clock,
  Truck,
  CheckCircle,
} from "lucide-vue-next";
import { h, onBeforeUnmount, onMounted, ref } from "vue";
import { httpRequest } from "@/utils/http";
import ReportRestaurantForm from "@/components/ReportRestaurantForm.vue";
import baseUrl from "@/utils/baseUrl";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const timer = ref("00:00");
const timerColor = ref("text-green-600");
let interval: any = null;

function startTimer(createdAt: string) {
  const start = new Date(createdAt).getTime();

  interval = setInterval(() => {
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    timer.value = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

    if (minutes >= 1) {
      timerColor.value = "text-red-600 font-bold";
    } else {
      timerColor.value = "text-green-600";
    }
  }, 1000);
}

function calcDriverCost(totalCost: number) {
  const basedPercentage = 0.15;
  const deduction = totalCost * basedPercentage;
  const total = totalCost - deduction;
  return total;
}

const openGoogleMaps = async (location: string) => {
  const lat = JSON.parse(location.replace(/\\/g, "")).lat;
  const lng = JSON.parse(location.replace(/\\/g, "")).lng;

  if (!lat || !lng) {
    alert("إحداثيات الموقع مش متوفرة!");
    return;
  }

  if (isNaN(lat) || isNaN(lng)) {
    alert("إحداثيات الموقع مش متوفرة!");
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  await Browser.open({ url });
};

const callCustomer = (phone: string) => {
  if (!phone) {
    alert("رقم العميل مش متوفر!");
    return;
  }
  window.open(`tel:${phone}`);
};

const handleOrderPickedUp = async (orderId: string) => {
  try {
    const photo = await Camera.getPhoto({
      quality: 40,
      resultType: CameraResultType.Base64,
      allowEditing: false,
      source: CameraSource.Camera,
      promptLabelHeader: "تأكيد الهوية بالسيلفي",
    });

    if (photo.base64String) {
      httpRequest({
        url: `/api/driver/update_order/${orderId}`,
        method: "PUT",
        data: {
          order_status: "picked-up",
          photo: `data:image/jpeg;base64,${photo.base64String}`,
        },
      });
    }
  } catch (error) {
    console.error("Error taking photo or updating order status:", error);
    alert("Failed to take photo or update order status.");
  }
};

const handleOrderDelivered = (orderId: string) => {
  httpRequest({
    url: `/api/driver/order_delivered/${orderId}`,
    method: "PUT",
    data: {},
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
    case "delivered":
      return h(CheckCircle, { class: "h-4 w-4" });
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
    case "delivered":
      return "bg-green-500/10 text-green-500 border-green-500/20";
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
onMounted(() => {
  if (props.order.order_status === "preparing") {
    startTimer(props.order.created_at);
  }

  if (props.order.order_status === "ready") {
    startTimer(props.order.ready_at);
  }

  if (props.order.order_status === "picked-up") {
    startTimer(props.order.picked_up_at);
  }
});

onBeforeUnmount(() => {
  if (interval) clearInterval(interval);
});
</script>
<template>
  <Card class="mb-8 p-2 rounded shadow border-primary/20 relative">
    <CardHeader>
      <CardTitle class="flex items-start flex-col gap-2 text-primary">
        <div class="absolute top-2 left-2">
          <span :class="timerColor">
            {{ timer }}
          </span>
        </div>
        <Badge :class="getStatusColor(props.order.order_status)">
          <component
            :is="getStatusIcon(props.order.order_status)"
            class="h-3 w-3"
          />
          <span class="ml-1 capitalize">
            {{ getStatus(props.order.order_status) }}
          </span>
        </Badge>
        <div class="flex items-center gap-2">
          <Navigation class="h-5 w-5" />
          <span> التوصيل الحالي - رقم #{{ props.order.order_id }} </span>
        </div>
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <h4 class="font-medium">مكان الاستلام</h4>
            <p class="text-sm">{{ props.order.restaurant.restaurant_name }}</p>
            <p class="text-sm text-muted-foreground">
              {{ props.order.restaurant.restaurant_address }}
            </p>
          </div>
          <Separator />
          <div class="space-y-2">
            <h4 class="font-medium">مكان التوصيل</h4>
            <p>
              {{ props.order.order_city }}
            </p>
          </div>
        </div>
        <Separator />

        <div
          class="flex items-center justify-between p-3 bg-card rounded-lg border"
        >
          <div class="text-right">
            <p class="font-bold">
              سعر الطلب: {{ props.order.order_total_price }} ج.م
            </p>
            <p class="text-sm text-muted-foreground">
              مصاريف التوصيل:
              {{ calcDriverCost(props.order.order_delivery_cost) }} ج.م
            </p>
          </div>
        </div>
        <Separator />

        <div
          v-if="props.order.order_receipt"
          class="p-3 bg-card rounded-lg border text-center"
        >
          <h4 class="font-medium mb-2">صورة الإيصال</h4>
          <img
            :src="baseUrl + props.order.order_receipt"
            alt="صورة الإيصال"
            class="w-full max-h-64 object-contain rounded-lg border"
          />
        </div>
        <p v-else class="text-sm text-muted-foreground">مفيش إيصال مرفوع</p>

        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="openGoogleMaps(props.order.restaurant.location)"
            >
              <Navigation class="h-4 w-4 mr-2" />
              افتح الموقع
            </Button>
            <Button
              variant="outline"
              @click="callCustomer(props.order.user_phone)"
            >
              <Phone class="h-4 w-4 mr-2" />
              اتصل بالعميل
            </Button>
          </div>
          <div
            v-if="props.order.order_status !== 'preparing'"
            class="flex flex-col gap-2"
          >
            <Button
              v-if="
                props.order.order_status !== 'preparing' &&
                props.order.order_status === 'ready'
              "
              class="bg-red-600"
              @click="handleOrderPickedUp(props.order.order_id)"
            >
              تم الاستلام
            </Button>
            <Button
              v-if="
                props.order.order_status !== 'preparing' &&
                props.order.order_status === 'picked-up'
              "
              class="bg-green-600"
              @click="handleOrderDelivered(props.order.order_id)"
            >
              تم التوصيل
            </Button>
            <ReportRestaurantForm
              v-if="props.order.order_status === 'delivered'"
              :restaurant-name="props.order.restaurant.name"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
