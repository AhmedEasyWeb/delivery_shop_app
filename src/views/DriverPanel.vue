<script setup lang="ts">
import { useDriverTracker } from "@/composables/useDriverTraker";
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff } from "lucide-vue-next";
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

const openWorkInstructions = ref(false);

const { isOnline, goOnline, goOffline, handleChangeCity } = useDriverTracker();
const authStore = useAuthStore();
const ordersStore = useOrdersStore();
const router = useRouter();
const orders = computed(() => ordersStore.orders);
const activeTab = ref("current-orders");
const city = ref(authStore.driver?.driver_city || "");
const cities = ref<{ city_id: number; city_name: string }[]>([]);

async function fetchCities() {
  try {
    const resp = await api.get("/cities", {
      params: { driver_id: authStore.driver?.driver_id },
    });
    cities.value = resp.data;
  } catch (err: any) {
    console.error("fetchCities error:", err);
    toast.error("فشل تحميل المدن");
  }
}

const handleLogout = () => {
  authStore.logout();
  router.push("/");
};

onMounted(async () => {
  await authStore.checkSession();
  if (!authStore.isAuthenticated) {
    authStore.logout();
    router.push("/");
  }
  await fetchCities();
  openWorkInstructions.value = true;
});
</script>

<template>
  <header
    dir="rtl"
    class="flex items-center justify-between px-4 py-3 shadow-md"
  >
    <div class="details flex items-center gap-2">
      <div class="avatar w-12 h-12 bg-primary rounded-full relative">
        <p
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-2xl text-white"
        >
          {{ authStore.driver?.driver_full_name.split("")[0] }}
        </p>
      </div>
      <div>
        <p class="font-bold">
          {{ authStore.driver?.driver_full_name.split(" ")[0] }}
        </p>
        <p class="text-xs text-gray-400">Driver Dashboard</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button
        :disabled="orders.length > 0"
        @click="isOnline ? goOffline() : goOnline()"
        class="flex items-center gap-2 relative bg-primary rounded shadow w-10 h-10"
      >
        <span class="text-white">
          <Wifi v-if="isOnline" class="" />
          <WifiOff v-else />
        </span>
      </Button>
      <Button
        @click="handleLogout"
        class="flex items-center gap-2 relative bg-primary rounded shadow w-10 h-10"
      >
        <LogOut />
      </Button>
    </div>
  </header>
  <div class="flex items-center p-6 gap-2">
    <Select v-model="city">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="اختر المدينة" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel class="text-gray-400">المدينة</SelectLabel>
          <SelectItem
            v-for="city in cities"
            :key="city.city_id"
            :value="city.city_name"
          >
            {{ city.city_name }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <Button @click="handleChangeCity(city)">تغير المدينة</Button>
  </div>
  <Dialog v-model:open="openWorkInstructions">
    <DialogContent class="sm:max-w-[500px]" dir="rtl">
      <DialogHeader>
        <DialogTitle>إرشادات العمل</DialogTitle>
      </DialogHeader>

      <p>1- الحفاظ على المظهر العام وأسلوب التعامل اللائق</p>
      <p>2- ممنوع لُبس الشِّبشب مطلقًا</p>
      <p>3- الالتزام بالباوتش أو صندوق التوصيل</p>
      <p>4- الحفاظ على نظافة العربة أو الموتوسيكل والتأكد من جاهزيته يوميًا</p>

      <DialogFooter>
        <Button variant="outline" @click="openWorkInstructions = false">
          موافق
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Tabs
    v-model="activeTab"
    dir="rtl"
    default-value="current-orders"
    class="w-full"
  >
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="current-orders">الطلبات الحالية</TabsTrigger>
      <TabsTrigger value="order-history">سجل الطلبات</TabsTrigger>
    </TabsList>
    <TabsContent value="current-orders">
      <DriverTab />
    </TabsContent>
    <TabsContent value="order-history">
      <OrderHistory />
    </TabsContent>
  </Tabs>
</template>
