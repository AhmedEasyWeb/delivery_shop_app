<script lang="ts" setup>
import {
  Award,
  BookUser,
  Home,
  Motorbike,
  UserRound,
  PanelLeft,
  ScanFace,
  Stamp,
  Utensils,
  LogOut,
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";

interface Route {
  title: string;
  url: string;
  icon: any;
}

const currentHashUrl = ref("");
const restaurantDropDown = ref(false);
const auth = useAuthStore();
const router = useRoute();

onMounted(async () => {
  await auth.init();
});

const routes: Route[] = [
  {
    title: "الرئيسية",
    url: "#hero",
    icon: Home,
  },
  {
    title: "من نحن",
    url: "#about",
    icon: UserRound,
  },
  {
    title: "خدماتنا",
    url: "#service",
    icon: Motorbike,
  },
  {
    title: "لماذا نحن",
    url: "#why_us",
    icon: Award,
  },
  {
    title: "تواصل معنا",
    url: "#contact",
    icon: BookUser,
  },
];

const scrollToHash = (hash: string) => {
  const targetId = hash.replace("#", "");
  if (router.path !== "/") {
    window.location.href = `/#${targetId}`;
    return;
  }

  const element = document.getElementById(targetId);
  if (element) {
    const offset = 80; // Height of sticky header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    history.pushState(null, "", "#" + targetId);
    currentHashUrl.value = "#" + targetId;
  }
};
</script>
<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    dir="ltr"
  >
    <div
      class="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-8"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
      >
        <img
          src="/logo.webp"
          alt="Delivery Shop Logo"
          class="h-10 w-auto object-contain"
        />
        <span
          class="hidden lg:block text-xl font-bold tracking-tight text-foreground"
          >Delivery Shop</span
        >
      </RouterLink>

      <nav class="hidden md:flex items-center gap-1 lg:gap-2" dir="rtl">
        <a
          v-for="route in routes"
          :key="route.url"
          :href="router.path !== '/' ? '/' + route.url : route.url"
          @click.prevent="scrollToHash(route.url)"
          class="relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full hover:bg-accent hover:text-accent-foreground"
          :class="
            currentHashUrl === route.url
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-muted-foreground'
          "
        >
          {{ route.title }}
        </a>

        <div class="mx-2 h-4 w-px bg-border"></div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="rounded-full gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Utensils class="h-4 w-4 text-primary" />
              <span>المطاعم</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48 mt-2">
            <template v-if="auth.isAuthenticated && auth.type === 'restaurant'">
              <DropdownMenuItem class="cursor-pointer gap-2 py-2.5">
                <RouterLink
                  to="/restaurant/dashboard"
                  class="flex items-center justify-end gap-2 w-full h-full"
                >
                  <UserRound class="h-4 w-4" /> الملف الشخصي
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                class="cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive"
                @click="auth.logout"
              >
                <div class="flex items-center justify-end gap-2 w-full h-full">
                  <LogOut class="h-4 w-4" /> تسجيل الخروج
                </div>
              </DropdownMenuItem>
            </template>
            <template v-else>
              <DropdownMenuItem class="cursor-pointer gap-2 py-2.5">
                <RouterLink
                  to="/restaurant"
                  class="flex items-center justify-end gap-2 w-full h-full"
                >
                  <ScanFace class="h-4 w-4" /> تسجيل الدخول
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer gap-2 py-2.5">
                <RouterLink
                  to="/restaurant/register"
                  class="flex items-center justify-end gap-2 w-full h-full"
                >
                  <Stamp class="h-4 w-4" /> انضم إلينا
                </RouterLink>
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div class="flex items-center md:hidden">
        <Sheet v-model:open="restaurantDropDown">
          <SheetTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="rounded-full border border-border"
            >
              <PanelLeft class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-72 p-0" dir="rtl">
            <div class="flex flex-col h-full">
              <SheetHeader class="p-6 text-right border-b">
                <div class="flex items-center gap-3">
                  <img src="/logo.webp" class="h-8 w-auto" />
                  <SheetTitle class="text-lg font-bold"
                    >Delivery Shop</SheetTitle
                  >
                </div>
              </SheetHeader>

              <div class="flex-1 overflow-y-auto p-4">
                <nav class="space-y-2">
                  <a
                    v-for="route in routes"
                    :key="route.url"
                    :href="router.path !== '/' ? '/' + route.url : route.url"
                    class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
                    @click.prevent="
                      scrollToHash(route.url);
                      restaurantDropDown = false;
                    "
                  >
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"
                    >
                      <component :is="route.icon" class="h-4 w-4" />
                    </div>
                    {{ route.title }}
                  </a>
                </nav>

                <div class="my-6 border-t pt-6">
                  <p
                    class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    خدمات المطاعم
                  </p>
                  <div class="space-y-2">
                    <template
                      v-if="auth.isAuthenticated && auth.type === 'restaurant'"
                    >
                      <Button
                        variant="outline"
                        class="w-full justify-start gap-3"
                      >
                        <RouterLink
                          to="/restaurant/dashboard"
                          class="flex items-center justify-start gap-3 w-full h-full"
                        >
                          <Utensils class="h-4 w-4" /> الملف الشخصي
                        </RouterLink>
                      </Button>
                      <Button
                        variant="default"
                        class="w-full justify-start gap-3"
                        @click="auth.logout"
                      >
                        <LogOut class="h-4 w-4" /> تسجيل الخروج
                      </Button>
                    </template>
                    <template v-else>
                      <Button
                        variant="outline"
                        class="w-full justify-start gap-3"
                      >
                        <RouterLink
                          to="/restaurant"
                          class="flex items-center justify-start gap-3 w-full h-full"
                        >
                          <ScanFace class="h-4 w-4" /> تسجيل الدخول
                        </RouterLink>
                      </Button>
                      <Button
                        variant="default"
                        class="w-full justify-start gap-3"
                      >
                        <RouterLink
                          to="/restaurant/register"
                          class="flex items-center justify-start gap-3 w-full h-full"
                        >
                          <Stamp class="h-4 w-4" /> تسجيل مطعم جديد
                        </RouterLink>
                      </Button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
