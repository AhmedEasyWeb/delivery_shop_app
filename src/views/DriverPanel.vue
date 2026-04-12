<script setup lang="ts">
import { useDriverTracker } from "@/composables/useDriverTraker";
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff, RefreshCw, MapPin } from "lucide-vue-next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderHistory from "@/components/OrderHistory.vue";
import DriverTab from "@/components/DriverTab.vue";
import { useOrdersStore } from "@/stores/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "vue-sonner";
import api from "@/api/axios";

const { goOnline, goOffline, changeCity, initNativeListeners } =
  useDriverTracker();
const authStore = useAuthStore();
const ordersStore = useOrdersStore();
const router = useRouter();

const openWorkInstructions = ref(false);
const isSyncing = ref(false);
const activeTab = ref("current-orders");
const city = ref(authStore.driver?.driver_city || "");
const cities = ref<{ city_id: number; city_name: string }[]>([]);

const orders = computed(() => ordersStore.orders);
const isOnline = computed(() => authStore.driver?.isOnline);

// Toggle Service
const toggleStatus = async () => {
  if (isOnline.value) {
    await goOffline();
    toast.info("أنت الآن غير متصل");
  } else {
    const success = await goOnline();
    if (success) toast.success("أنت الآن متصل ونشط");
  }
};

// Re-sync Connection (Force Restart Service)
const handleResync = async () => {
  isSyncing.value = true;
  await goOffline();
  setTimeout(async () => {
    await goOnline();
    isSyncing.value = false;
    toast.success("تم إعادة مزامنة الاتصال");
  }, 1000);
};

const handleCityUpdate = async () => {
  if (!city.value) return;
  await changeCity(city.value);
  toast.success(`تم تغيير المدينة إلى ${city.value}`);
};

async function fetchCities() {
  try {
    const resp = await api.get("/cities", {
      params: { driver_id: authStore.driver?.driver_id },
    });
    cities.value = resp.data;
  } catch (err: any) {
    toast.error("فشل تحميل المدن");
  }
}

const handleLogout = () => {
  goOffline(); // Always kill service on logout
  authStore.logout();
  router.push("/");
};

onMounted(async () => {
  await authStore.checkSession();
  if (!authStore.isAuthenticated) {
    router.push("/");
    return;
  }
  await initNativeListeners(); // Start the bridge listener
  await fetchCities();
  openWorkInstructions.value = true;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-10" dir="rtl">
    <div
      v-if="!isOnline"
      class="bg-destructive/10 text-destructive text-sm py-2 px-4 flex items-center justify-between border-b border-destructive/20"
    >
      <div class="flex items-center gap-2">
        <WifiOff :size="16" />
        <span>أنت غير متصل. لن تصلك طلبات جديدة.</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="toggleStatus"
        class="h-7 text-xs border border-destructive/50"
      >
        تفعيل الاتصال
      </Button>
    </div>

    <header
      class="bg-white flex items-center justify-between px-4 py-3 shadow-sm border-b"
    >
      <div class="flex items-center gap-3">
        <div
          class="avatar w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-inner"
        >
          <span class="font-bold text-lg text-white">
            {{ authStore.driver?.driver_full_name.charAt(0) }}
          </span>
        </div>
        <div>
          <p class="font-bold text-gray-800 leading-none mb-1">
            {{ authStore.driver?.driver_full_name.split(" ")[0] }}
          </p>
          <div class="flex items-center gap-1">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-gray-300',
              ]"
            ></div>
            <span
              class="text-[10px] uppercase tracking-wider text-gray-500 font-medium"
            >
              {{ isOnline ? "Online" : "Offline" }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="handleResync"
          :disabled="isSyncing"
          class="rounded-full w-10 h-10 border-gray-200"
          title="إعادة مزامنة"
        >
          <RefreshCw :size="18" :class="{ 'animate-spin': isSyncing }" />
        </Button>

        <Button
          @click="toggleStatus"
          :disabled="orders.length > 0"
          :class="[
            'rounded-full w-10 h-10 shadow-sm transition-colors',
            isOnline
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-200 text-gray-600',
          ]"
        >
          <Wifi v-if="isOnline" :size="20" class="text-white" />
          <WifiOff v-else :size="20" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          @click="handleLogout"
          class="rounded-full w-10 h-10 shadow-sm"
        >
          <LogOut :size="18" />
        </Button>
      </div>
    </header>

    <main class="max-w-md mx-auto">
      <div class="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 mb-3 text-gray-500">
          <MapPin :size="16" />
          <span class="text-sm font-medium">نطاق العمل الحالي</span>
        </div>
        <div class="flex items-center gap-2">
          <Select v-model="city">
            <SelectTrigger
              class="bg-gray-50 border-none shadow-none focus:ring-1"
            >
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="c in cities"
                  :key="c.city_id"
                  :value="c.city_name"
                >
                  {{ c.city_name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            @click="handleCityUpdate"
            variant="secondary"
            class="shrink-0"
          >
            تحديث
          </Button>
        </div>
      </div>

      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="flex mx-4 mb-4 bg-gray-200/50 p-1 rounded-lg">
          <TabsTrigger
            value="current-orders"
            class="flex-1 rounded-md py-2 transition-all"
          >
            الطلبات الحالية
            <span
              v-if="orders.length > 0"
              class="mr-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {{ orders.length }}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="order-history"
            class="flex-1 rounded-md py-2 transition-all"
          >
            سجل الطلبات
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="current-orders"
          class="px-4 animate-in fade-in slide-in-from-bottom-2"
        >
          <DriverTab />
        </TabsContent>

        <TabsContent
          value="order-history"
          class="px-4 animate-in fade-in slide-in-from-bottom-2"
        >
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </main>

    <Dialog v-model:open="openWorkInstructions">
      <DialogContent class="sm:max-w-[400px] rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle class="text-center text-xl font-bold"
            >إرشادات العمل 📋</DialogTitle
          >
        </DialogHeader>

        <div class="space-y-4 py-4 text-gray-700">
          <div class="flex gap-3 items-start">
            <span
              class="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm"
              >1</span
            >
            <p>
              الحفاظ على المظهر العام وأسلوب التعامل اللائق مع العملاء والمطاعم.
            </p>
          </div>
          <div class="flex gap-3 items-start">
            <span
              class="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm"
              >2</span
            >
            <p>
              يُمنع منعاً باتاً ارتداء "الشبشب" أثناء العمل؛ الالتزام بالحذاء
              المناسب.
            </p>
          </div>
          <div class="flex gap-3 items-start">
            <span
              class="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm"
              >3</span
            >
            <p>
              الالتزام باستخدام الباوتش أو صندوق التوصيل الحراري للحفاظ على جودة
              الطعام.
            </p>
          </div>
          <div class="flex gap-3 items-start">
            <span
              class="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm"
              >4</span
            >
            <p>
              التأكد من نظافة وجاهزية وسيلة المواصلات (موتوسيكل/عربة) يومياً.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            class="w-full h-12 text-lg rounded-xl"
            @click="openWorkInstructions = false"
          >
            أدركت ذلك، ابدأ العمل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.avatar {
  background: linear-gradient(135deg, hsl(var(--primary)), #3b82f6);
}
</style>
