<script setup lang="ts">
import { useDriverTracker } from "@/composables/useDriverTraker";
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Info,
  MessageCircle,
  Battery,
  BatteryWarning,
} from "lucide-vue-next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderHistory from "@/components/OrderHistory.vue";
import DriverTab from "@/components/DriverTab.vue";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
const openWorkInstructions = ref(false);
const showBatteryModal = ref(false);

const { isOnline, goOnline, goOffline } = useDriverTracker();
const authStore = useAuthStore();
const router = useRouter();
const activeTab = ref("current-orders");

const refreshData = async () => {
  await goOffline();
  await goOnline();
};

onMounted(async () => {
  await authStore.checkSession();
  if (!authStore.isAuthenticated) {
    authStore.logout();
    router.push("/");
  }
  openWorkInstructions.value = true;
});

function redirectToWhatsApp(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  window.open(whatsappUrl, "_blank");
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans" dir="rtl">
    <header
      class="bg-white px-4 py-4 shadow-sm border-b border-slate-100 sticky top-0 z-30 safe-pt"
    >
      <div class="max-w-md mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div
              class="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100"
            >
              <span class="text-white font-black text-xl">
                {{ authStore.driver?.driver_full_name?.charAt(0) || "D" }}
              </span>
            </div>
            <div
              class="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              :class="isOnline ? 'bg-emerald-500' : 'bg-slate-300'"
            ></div>
          </div>

          <div>
            <h2 class="font-black text-slate-900 leading-tight">
              {{ authStore.driver?.driver_full_name?.split(" ")[0] }}
            </h2>
            <div class="flex items-center gap-1">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >كابتن توصيل</span
              >
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            @click="refreshData"
            class="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 active:rotate-180 transition-transform duration-500"
          >
            <RefreshCw class="w-5 h-5" />
          </Button>

          <Button
            class="h-11 px-4 rounded-xl font-black transition-all shadow-md active:scale-95"
            :class="
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-none'
            "
          >
            <component :is="isOnline ? Wifi : WifiOff" class="w-4 h-4 ml-2" />
            {{ isOnline ? "متصل" : "غير متصل" }}
          </Button>
        </div>
      </div>
    </header>

    <Dialog v-model:open="openWorkInstructions">
      <DialogContent
        class="w-[90%] rounded-4xl p-6 border-none shadow-2xl"
        dir="rtl"
      >
        <DialogHeader class="text-right">
          <div
            class="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          >
            <Info class="text-amber-600 w-6 h-6" />
          </div>
          <DialogTitle class="text-xl font-black text-slate-900"
            >إرشادات العمل</DialogTitle
          >
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div
            v-for="(text, index) in [
              'الحفاظ على المظهر العام وأسلوب التعامل اللائق',
              'ممنوع لُبس الشِّبشب مطلقًا',
              'الالتزام بالباوتش أو صندوق التوصيل',
              'الحفاظ على نظافة المركبة والتأكد من جاهزيتها',
            ]"
            :key="index"
            class="flex gap-3 items-start"
          >
            <div
              class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0"
            >
              {{ index + 1 }}
            </div>
            <p class="text-slate-600 font-bold text-sm leading-relaxed">
              {{ text }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            class="w-full h-12 rounded-2xl bg-slate-900 font-black text-white"
            @click="openWorkInstructions = false"
          >
            موافق، فهمت
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showBatteryModal">
      <DialogContent
        class="w-[90%] rounded-4xl p-6 border-none shadow-2xl"
        dir="rtl"
      >
        <DialogHeader class="text-right">
          <div
            class="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          >
            <BatteryWarning class="text-blue-600 w-6 h-6" />
          </div>
          <DialogTitle class="text-xl font-black text-slate-900"
            >تحسين أداء التتبع</DialogTitle
          >
        </DialogHeader>

        <div class="space-y-4 py-4">
          <p class="text-slate-500 text-sm font-medium">
            لضمان استمرار تتبع موقعك بشكل دقيق حتى عند إغلاق الشاشة، يرجى ضبط
            إعدادات البطارية:
          </p>
          <div
            v-for="(step, index) in [
              'اذهب إلى إعدادات الهاتف (Settings)',
              'اختر التطبيقات (Apps)',
              'ابحث عن تطبيق DeliveryShop وافتحه',
              'اختر البطارية (Battery)',
              'حدد خيار غير مقيد (Unrestricted)',
            ]"
            :key="index"
            class="flex gap-3 items-start"
          >
            <div
              class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0"
            >
              {{ index + 1 }}
            </div>
            <p class="text-slate-600 font-bold text-sm leading-relaxed">
              {{ step }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            class="w-full h-12 rounded-2xl bg-slate-900 font-black text-white"
            @click="showBatteryModal = false"
          >
            حسناً، سأفعل ذلك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <main class="max-w-md mx-auto">
      <div class="px-4 py-2 grid grid-cols-2 gap-2">
        <Button
          @click="redirectToWhatsApp('+201214555196')"
          class="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
        >
          <MessageCircle class="w-5 h-5" />
          الدعم الفني
        </Button>
        <Button
          @click="showBatteryModal = true"
          class="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Battery class="w-5 h-5" />
          ضبط البطارية
        </Button>
      </div>

      <Tabs
        v-model="activeTab"
        dir="rtl"
        default-value="current-orders"
        class="w-full"
      >
        <div class="px-4">
          <TabsList
            class="grid w-full grid-cols-2 h-14 bg-slate-200/50 rounded-2xl p-1"
          >
            <TabsTrigger
              value="current-orders"
              class="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
            >
              الطلبات الحالية
            </TabsTrigger>
            <TabsTrigger
              value="order-history"
              class="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
            >
              سجل الطلبات
            </TabsTrigger>
          </TabsList>
        </div>

        <div class="mt-4 pb-20 px-2">
          <TabsContent
            value="current-orders"
            class="animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <DriverTab />
          </TabsContent>
          <TabsContent
            value="order-history"
            class="animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <OrderHistory />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  </div>
</template>
