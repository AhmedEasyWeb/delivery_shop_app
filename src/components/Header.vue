<script lang="ts" setup>
import {
  Award,
  BookUser,
  Home,
  Motorbike,
  UserRound,
  PanelLeft,
  PackageCheck,
  ScanFace,
  Stamp,
  Utensils,
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { useRouter } from "vue-router";

interface Route {
  title: string;
  url: string;
  icon: any;
}

const currentHashUrl = ref("");
const driverDropDown = ref(false);
const restaurantDropDown = ref(false);
const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.checkSession();
  await auth.checkRestaurantSession();

  if (auth.isAuthenticated) {
    if (auth.type === "driver") {
      router.push("/driver-panel");
      return;
    }
    if (auth.type === "restaurant") {
      router.push("/restaurant/dashboard");
      return;
    }
  }
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
    url: "contact",
    icon: BookUser,
  },
];

function goToHash(uri: string) {
  window.location.hash = `#${uri}`;
  currentHashUrl.value = `#${uri}`;
}

function goTo(uri: string) {
  router.push(uri);
}
</script>
<template>
  <header class="bg-white shadow-md py-4 px-4 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center">
        <img src="/logo.webp" alt="Delivery Shop Logo" class="h-10" />
      </div>

      <nav class="hidden md:flex items-center space-x-8">
        <a
          @click="goToHash('hero')"
          class="text-gray-700 hover:text-red-600 font-medium cursor-pointer transition-colors duration-300"
          :class="currentHashUrl === '#hero' ? 'text-red-600' : ''"
        >
          الرئيسية
        </a>
        <a
          @click="goToHash('about')"
          class="text-gray-700 hover:text-red-600 text-lg font-medium cursor-pointer transition-colors duration-300"
          :class="currentHashUrl === '#about' ? 'text-red-600' : ''"
        >
          من نحن
        </a>
        <a
          @click="goToHash('service')"
          class="text-gray-700 hover:text-red-600 text-lg font-medium cursor-pointer transition-colors duration-300"
          :class="currentHashUrl === '#service' ? 'text-red-600' : ''"
        >
          خدماتنا
        </a>
        <a
          @click="goToHash('why_us')"
          class="text-gray-700 hover:text-red-600 font-medium cursor-pointer transition-colors duration-300"
          :class="currentHashUrl === '#why_us' ? 'text-red-600' : ''"
        >
          لماذا نحن
        </a>
        <a
          @click="goToHash('contact')"
          class="text-gray-700 hover:text-red-600 font-medium cursor-pointer transition-colors duration-300"
          :class="currentHashUrl === '#contact' ? 'text-red-600' : ''"
        >
          تواصل معنا
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger class="cursor-pointer">
            الطيارين
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <template v-if="auth.isAuthenticated && auth.type === 'driver'">
              <DropdownMenuItem @click="goTo('/driver-panel')">
                <p>الملف الشخصي</p>
              </DropdownMenuItem>
              <DropdownMenuItem @click="auth.logout">
                تسجيل الخروج
              </DropdownMenuItem>
            </template>
            <template v-else>
              <DropdownMenuItem @click="goTo('/')">
                تسجيل الدخول
              </DropdownMenuItem>
              <DropdownMenuItem @click="goTo('/register')">
                تسجيل
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger class="cursor-pointer"
            >المطاعم</DropdownMenuTrigger
          >
          <DropdownMenuContent>
            <template v-if="auth.isAuthenticated && auth.type === 'restaurant'">
              <DropdownMenuItem @click="goTo('/restaurant/dashboard')">
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem @click="auth.logout">
                تسجيل الخروج
              </DropdownMenuItem>
            </template>
            <template v-else>
              <DropdownMenuItem @click="goTo('/restaurant')">
                تسجيل الدخول
              </DropdownMenuItem>
              <DropdownMenuItem @click="goTo('/restaurant/register')">
                تسجيل
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <Sheet>
        <SheetTrigger class="md:hidden">
          <Button class="bg-white text-black hover:bg-accent cursor-pointer">
            <PanelLeft />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>
              <p class="text-2xl">Delivery Shop</p>
            </SheetTitle>
            <SheetDescription>
              <div class="menu mt-5 space-y-3">
                <a
                  v-for="route in routes"
                  :href="route.url"
                  class="flex items-center gap-5 text-black bg-accent rounded p-2"
                >
                  <component :is="route.icon" class="w-4 h-4" />
                  <p>{{ route.title }}</p>
                </a>
                <div
                  @click="driverDropDown = !driverDropDown"
                  class="flex items-start flex-col gap-5 text-black bg-accent rounded p-2"
                >
                  <div class="flex items-center gap-5">
                    <PackageCheck class="w-4 h-4" />
                    <p>الطيارين</p>
                  </div>
                  <div v-if="driverDropDown" class="ml-2 text-lg">
                    <template
                      v-if="auth.isAuthenticated && auth.type === 'driver'"
                    >
                      <router-link
                        to="/driver-panel"
                        class="flex items-center gap-5 text-black mb-2"
                      >
                        <PackageCheck class="w-4 h-4" />
                        <p>الملف الشخصي</p>
                      </router-link>
                      <a
                        @click="auth.logout"
                        class="flex items-center gap-5 text-black cursor-pointer"
                      >
                        <ScanFace class="w-4 h-4" />
                        <p>تسجيل الخروج</p>
                      </a>
                    </template>
                    <template v-if="!auth.isAuthenticated">
                      <router-link
                        to="/"
                        class="flex items-center gap-5 text-black mb-2"
                      >
                        <ScanFace class="w-4 h-4" />
                        <p>تسجيل دخول</p>
                      </router-link>
                      <router-link
                        to="/register"
                        class="flex items-center gap-5 text-black"
                      >
                        <Stamp class="w-4 h-4" />
                        <p>تسجيل</p>
                      </router-link>
                    </template>
                  </div>
                </div>
                <div
                  @click="restaurantDropDown = !restaurantDropDown"
                  class="flex items-start flex-col gap-5 text-black bg-accent rounded p-2"
                >
                  <div class="flex items-center gap-5">
                    <Utensils class="w-4 h-4" />
                    <p>المطاعم</p>
                  </div>
                  <div v-if="restaurantDropDown" class="ml-2 text-lg">
                    <template
                      v-if="auth.isAuthenticated && auth.type === 'restaurant'"
                    >
                      <router-link
                        to="/restaurant/dashboard"
                        class="flex items-center gap-5 text-black mb-2"
                      >
                        <Utensils class="w-4 h-4" />
                        <p>الملف الشخصي</p>
                      </router-link>
                      <a
                        @click="auth.logout"
                        class="flex items-center gap-5 text-black cursor-pointer"
                      >
                        <ScanFace class="w-4 h-4" />
                        <p>تسجيل الخروج</p>
                      </a>
                    </template>
                    <template v-if="!auth.isAuthenticated">
                      <router-link
                        to="/restaurant"
                        class="flex items-center gap-5 text-black mb-2"
                      >
                        <ScanFace class="w-4 h-4" />
                        <p>تسجيل دخول</p>
                      </router-link>
                      <router-link
                        to="/restaurant/register"
                        class="flex items-center gap-5 text-black"
                      >
                        <Stamp class="w-4 h-4" />
                        <p>تسجيل</p>
                      </router-link>
                    </template>
                  </div>
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  </header>
</template>
