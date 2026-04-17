<script setup lang="ts">
import { Browser } from "@capacitor/browser";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Navigation, Phone, Clock, Wallet, FileText, X } from "lucide-vue-next";
import { onBeforeUnmount, onMounted, ref } from "vue";
import api from "@/api/axios";
import ReportRestaurantForm from "@/components/ReportRestaurantForm.vue";
import baseUrl from "@/utils/baseUrl";
import { toast } from "vue-sonner";
import {
  getPaymentMethod,
  getStatus,
  getStatusColor,
  getStatusIcon,
} from "@/lib/utils";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const timer = ref("00:00");
const timerColor = ref("text-green-600");
let interval: any = null;

// Modal state
const isModalOpen = ref(false);
const selectedImageUrl = ref("");

function startTimer(createdAt: string) {
  const start = new Date(createdAt).getTime();

  interval = setInterval(() => {
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    timer.value = `${String(minutes).padStart(2, "0")}:${String(
      seconds,
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

function openImage(url: string) {
  selectedImageUrl.value = url;
  isModalOpen.value = true;
}

function redirectToWhatsApp(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  window.open(whatsappUrl, "_blank");
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
      resultType: CameraResultType.Uri,
      allowEditing: false,
      source: CameraSource.Camera,
      promptLabelHeader: "تأكيد استلام الطلب",
    });

    if (photo.webPath) {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("order_status", "picked-up");
      formData.append("photo", blob, `order_${orderId}.jpg`);

      await api.put(`/driver/update_order/${orderId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم استلام الطلب بنجاح!");
    }
  } catch (error) {
    console.error("Error taking photo or updating order status:", error);
    toast.error("فشل في استلام الطلب.");
  }
};

const handleOrderDelivered = async (orderId: string) => {
  try {
    await api.put(`/driver/order_delivered/${orderId}`, {});
    toast.success("تم توصيل الطلب بنجاح!");
  } catch (error) {
    console.error("Error updating order status:", error);
    toast.error("فشل في تحديث حالة الطلب.");
  }
};

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
  <Card
    class="mb-6 overflow-hidden rounded-4xl border-none shadow-lg bg-white relative"
    dir="rtl"
  >
    <div class="px-5 pt-5 pb-2 flex justify-between items-center">
      <Badge
        :class="[
          getStatusColor(props.order.order_status),
          'rounded-full px-3 py-1 border-none font-black text-[10px]',
        ]"
      >
        <component
          :is="getStatusIcon(props.order.order_status)"
          class="h-3 w-3 ml-1"
        />
        {{ getStatus(props.order.order_status) }}
      </Badge>

      <div
        class="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full"
      >
        <Clock class="w-3.5 h-3.5 text-slate-500" />
        <span :class="[timerColor, 'font-mono font-bold text-sm']">{{
          timer
        }}</span>
      </div>
    </div>

    <CardHeader class="pt-2 pb-0">
      <CardTitle
        class="text-lg font-black text-slate-900 flex items-center gap-2"
      >
        <div class="p-2 bg-red-50 rounded-xl">
          <Navigation class="h-5 w-5 text-red-600" />
        </div>
        <span>التوصيل الحالي - رقم #{{ props.order.order_id }}</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="pt-6 space-y-6">
      <div
        class="relative space-y-6 mr-2 border-r-2 border-dashed border-slate-100 pr-6"
      >
        <div class="relative">
          <div
            class="absolute -right-[33px] top-1 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"
          ></div>
          <h4 class="text-xs font-black text-slate-400 mb-1">مكان الاستلام</h4>
          <p class="font-black text-slate-800 leading-tight">
            {{ props.order.restaurant.restaurant_name }}
          </p>
          <p class="text-sm text-slate-500 mt-1">
            {{ props.order.restaurant.restaurant_address }}
          </p>
        </div>

        <div class="relative">
          <div
            class="absolute -right-[33px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"
          ></div>
          <h4 class="text-xs font-black text-slate-400 mb-1">مكان التوصيل</h4>
          <p class="font-black text-slate-800">{{ props.order.order_city }}</p>
        </div>
      </div>

      <div class="bg-slate-50 rounded-3xl p-5 space-y-3">
        <div
          class="flex justify-between items-center border-b border-slate-200 pb-3"
        >
          <div class="flex items-center gap-2">
            <Wallet class="w-4 h-4 text-slate-400" />
            <span class="text-xs font-bold text-slate-500">طريقة الدفع</span>
          </div>
          <p class="font-black text-slate-800">
            {{ getPaymentMethod(props.order.payment_method) }}
          </p>
        </div>

        <div class="flex justify-between items-end">
          <div class="text-right">
            <p class="font-bold text-slate-900">
              سعر الطلب: {{ props.order.order_total_price }} ج.م
            </p>
            <p class="text-sm text-slate-500 font-medium">
              مصاريف التوصيل:
              {{ calcDriverCost(props.order.order_delivery_cost) }} ج.م
            </p>
          </div>
        </div>
      </div>

      <div v-if="props.order.order_receipt" class="space-y-2">
        <div class="flex items-center gap-2 px-1">
          <FileText class="w-4 h-4 text-slate-400" />
          <span class="text-xs font-bold text-slate-500">صورة الإيصال</span>
        </div>
        <img
          @click="openImage(baseUrl + props.order.order_receipt)"
          :src="baseUrl + props.order.order_receipt"
          alt="صورة الإيصال"
          class="w-full h-40 object-contain rounded-2xl bg-white border border-slate-100 shadow-sm"
        />
      </div>
      <p
        v-else
        class="text-sm text-center text-slate-400 font-medium bg-slate-50 py-3 rounded-xl border border-dashed"
      >
        مفيش إيصال مرفوع
      </p>

      <div class="space-y-3">
        <Button
          class="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold"
          @click="redirectToWhatsApp(props.order.user_phone)"
        >
          <MessageCircle class="h-5 w-5 ml-2" />
          تواصل عبر واتساب
        </Button>

        <div class="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            class="h-12 rounded-2xl border-slate-200 font-bold text-slate-700"
            @click="openGoogleMaps(props.order.restaurant.location)"
          >
            <Navigation class="h-4 w-4 ml-2" />
            الموقع
          </Button>
          <Button
            variant="outline"
            class="h-12 rounded-2xl border-slate-200 font-bold text-slate-700"
            @click="callCustomer(props.order.user_phone)"
          >
            <Phone class="h-4 w-4 ml-2" />
            اتصال هاتفي
          </Button>
        </div>
      </div>

      <div v-if="props.order.order_status !== 'preparing'" class="pt-2">
        <Button
          v-if="props.order.order_status === 'ready'"
          class="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-lg shadow-red-100"
          @click="handleOrderPickedUp(props.order.order_id)"
        >
          تم الاستلام
        </Button>

        <Button
          v-if="props.order.order_status === 'picked-up'"
          class="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-lg shadow-emerald-100"
          @click="handleOrderDelivered(props.order.order_id)"
        >
          تم التوصيل
        </Button>

        <ReportRestaurantForm
          v-if="props.order.order_status === 'delivered'"
          :restaurant-name="props.order.restaurant.restaurant_name"
        />
      </div>
    </CardContent>
  </Card>
  <Transition name="fade">
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      @click.self="isModalOpen = false"
    >
      <button
        @click="isModalOpen = false"
        class="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      >
        <X class="h-6 w-6" />
      </button>

      <img
        :src="selectedImageUrl"
        class="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
        alt="Order Preview"
      />
    </div>
  </Transition>
</template>
