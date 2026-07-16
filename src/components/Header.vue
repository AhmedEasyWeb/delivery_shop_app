<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Menu,
  Home,
  ShoppingBag,
  LogOut,
  BarChart,
  MessageCircle,
} from "lucide-vue-next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreateOrders from "./CreateOrders.vue";
import { useWebSocket } from "@/composables/useWebSocket";
import { useOrderTimers } from "@/composables/useOrderTimer";
import SupportDialog from "./support/SupportDialog.vue";

const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.init();

  if (!auth.isAuthenticated) {
    auth.logout();
    router.push("/restaurant");
  }
});

const { sendMessage, init } = useWebSocket(auth.user?.restaurant_id || 0);
const { startTimers } = useOrderTimers(ref([]), sendMessage);

watch(
  () => auth.user?.restaurant_id,
  (newId) => {
    if (newId) {
      init(newId);
      startTimers();
    }
  },
  { immediate: true },
);

const isDrawerOpen = ref(false);
const showSupportDialog = ref(false);

const handleLogout = () => {
  auth.logout();
  router.push("/restaurant");
  isDrawerOpen.value = false;
};

const menuItems = [
  { icon: Home, label: "الرئيسية", path: "/restaurant/dashboard" },
  { icon: ShoppingBag, label: "الطلبات", path: "/restaurant/orders" },
  { icon: BarChart, label: "التقارير", path: "/restaurant/reports" },
];
</script>
<template>
  <header class="sticky top-0 z-50 w-full border-b border-border bg-background">
    <div
      class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6"
    >
      <div class="flex items-center gap-4">
        <div
          class="h-10 w-10 overflow-hidden rounded-lg border border-border shadow-sm"
        >
          <img
            :src="auth.user?.logo_image || '/default-restaurant-logo.png'"
            alt="Restaurant Logo"
            class="h-full w-full object-cover"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-bold leading-none text-foreground">
            {{ auth.user?.name }}
          </span>
          <span
            class="mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-tight"
          >
            لوحة الإدارة
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden sm:block">
          <CreateOrders />
        </div>

        <div class="h-6 w-px bg-border mx-1 hidden sm:block"></div>

        <Sheet v-model:open="isDrawerOpen">
          <SheetTrigger as-child>
            <Button variant="outline" size="sm" class="flex gap-2 font-medium">
              <Menu class="h-4 w-4" />
              <span>القائمة</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" class="w-[300px] p-0" dir="rtl">
            <div class="flex flex-col h-full bg-card">
              <div class="p-6 border-b border-border bg-muted/30">
                <div class="flex items-center gap-3">
                  <img
                    :src="
                      auth.user?.logo_image || '/default-restaurant-logo.png'
                    "
                    alt="Logo"
                    class="h-12 w-12 rounded-lg border border-border bg-background object-cover shadow-sm"
                  />
                  <div class="text-right">
                    <SheetTitle class="text-base font-bold">{{
                      auth.user?.name
                    }}</SheetTitle>
                    <SheetDescription class="text-xs"
                      >مدير النظام</SheetDescription
                    >
                  </div>
                </div>
              </div>

              <nav class="flex-1 p-4 space-y-1">
                <div class="sm:hidden mb-4">
                  <CreateOrders class="w-full justify-start" />
                  <Separator class="my-4" />
                </div>

                <Button
                  v-for="item in menuItems"
                  :key="item.path"
                  variant="ghost"
                  class="w-full justify-start gap-3 h-11 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
                  @click="
                    router.push(item.path);
                    isDrawerOpen = false;
                  "
                >
                  <component
                    :is="item.icon"
                    class="h-4 w-4 text-muted-foreground"
                  />
                  {{ item.label }}
                </Button>

                <Button
                  variant="ghost"
                  class="w-full justify-start gap-3 h-11 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
                  @click="
                    showSupportDialog = true;
                    isDrawerOpen = false;
                  "
                >
                  <MessageCircle class="h-4 w-4 text-muted-foreground" />
                  <span>الدعم الفني</span>
                </Button>
              </nav>

              <div class="p-4 border-t border-border mt-auto">
                <Button
                  variant="ghost"
                  class="w-full justify-start gap-3 h-11 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="handleLogout"
                >
                  <LogOut class="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>

  <SupportDialog v-model:open="showSupportDialog" />
</template>
