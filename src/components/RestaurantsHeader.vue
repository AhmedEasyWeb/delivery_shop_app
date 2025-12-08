<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Menu,
  Home,
  ShoppingBag,
  LogOut,
  Users,
  BarChart,
} from "lucide-vue-next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreateOrders from "./CreateOrders.vue";
import baseUrl from "@/utils/baseUrl";

const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.checkRestaurantSession();
  if (!auth.isAuthenticated) {
    auth.logout();
    router.push("/");
  }
});

const isDrawerOpen = ref(false);

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
  <header class="flex justify-between border-b border-border bg-card" dir="rtl">
    <div class="flex h-16 items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <img
          :src="
            baseUrl + auth.user?.logo_image || '/default-restaurant-logo.png'
          "
          alt="Restaurant Logo"
          class="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h1 class="text-lg font-bold text-foreground">
            {{ auth.user?.name }}
          </h1>
          <p class="text-sm text-muted-foreground">لوحة المطعم</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 pl-3">
      <Drawer v-model:open="isDrawerOpen">
        <DrawerTrigger as-child>
          <Button variant="ghost" size="icon">
            <Menu class="h-5 w-5" />
          </Button>
        </DrawerTrigger>

        <DrawerContent dir="rtl">
          <DrawerHeader class="text-right">
            <div class="flex items-center justify-between gap-3 mb-4">
              <img
                :src="
                  baseUrl + auth.user?.logo_image ||
                  '/default-restaurant-logo.png'
                "
                alt="Restaurant Logo"
                class="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <DrawerTitle class="text-xl">{{ auth.user?.name }}</DrawerTitle>
                <DrawerDescription>لوحة التحكم</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div class="px-4 py-2">
            <nav class="space-y-2">
              <Button
                v-for="item in menuItems"
                :key="item.path"
                variant="ghost"
                class="w-full justify-start gap-3"
                @click="
                  router.push(item.path);
                  isDrawerOpen = false;
                "
              >
                <component :is="item.icon" class="h-5 w-5" />
                <span>{{ item.label }}</span>
              </Button>
            </nav>
            <Separator class="my-4" />

            <CreateOrders />

            <Separator class="my-4" />

            <Button
              variant="ghost"
              class="w-full justify-start gap-3 text-destructive hover:text-destructive"
              @click="handleLogout"
            >
              <LogOut class="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>

          <DrawerFooter>
            <DrawerClose as-child>
              <Button variant="outline">إغلاق</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  </header>
</template>
