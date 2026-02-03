<script lang="ts" setup>
import {
  Award,
  BookUser,
  Home,
  Motorbike,
  UserRound,
  Menu,
  PackageCheck,
  ScanFace,
  Stamp,
  Utensils,
  LogOut,
  ChevronDown,
  UserCircle,
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
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const currentHashUrl = ref("#hero");
const driverOpen = ref(false);
const restaurantOpen = ref(false);

const routes = [
  { title: "الرئيسية", url: "hero", icon: Home },
  { title: "من نحن", url: "about", icon: UserRound },
  { title: "خدماتنا", url: "service", icon: Motorbike },
  { title: "لماذا نحن", url: "why_us", icon: Award },
  { title: "تواصل معنا", url: "contact", icon: BookUser },
];

onMounted(async () => {
  await auth.checkSession();
  await auth.checkRestaurantSession();
});

function goToHash(uri: string) {
  window.location.hash = `#${uri}`;
  currentHashUrl.value = `#${uri}`;
}

const handleLogout = async () => {
  await auth.logout();
  router.push("/");
};
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div
        class="flex items-center gap-2 select-none cursor-pointer"
        @click="router.push('/')"
      >
        <img src="/logo.webp" alt="Delivery Shop Logo" class="h-10" />
        <span class="text-xl font-black text-slate-900 tracking-tight"
          >Delivery<span class="text-red-600">Shop</span></span
        >
      </div>

      <nav class="hidden md:flex items-center gap-1">
        <button
          v-for="route in routes"
          :key="route.url"
          @click="goToHash(route.url)"
          :class="[
            'px-4 py-2 rounded-full text-sm font-bold transition-all',
            currentHashUrl === `#${route.url}`
              ? 'bg-red-50 text-red-600'
              : 'text-slate-600 hover:bg-slate-50',
          ]"
        >
          {{ route.title }}
        </button>

        <div class="h-6 w-px bg-slate-200 mx-2"></div>

        <div class="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                class="rounded-full font-bold text-slate-700"
                >الطيارين <ChevronDown class="mr-1 w-4 h-4 opacity-50"
              /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              class="w-48 rounded-2xl p-2 shadow-xl border-slate-100"
            >
              <template v-if="auth.isAuthenticated && auth.type === 'driver'">
                <DropdownMenuItem
                  @click="router.push('/driver-panel')"
                  class="rounded-xl p-3 font-bold cursor-pointer"
                  >الملف الشخصي</DropdownMenuItem
                >
                <DropdownMenuItem
                  @click="handleLogout"
                  class="rounded-xl p-3 font-bold text-red-600 cursor-pointer"
                  >تسجيل الخروج</DropdownMenuItem
                >
              </template>
              <template v-else>
                <DropdownMenuItem
                  @click="router.push('/')"
                  class="rounded-xl p-3 font-bold cursor-pointer"
                  >تسجيل دخول</DropdownMenuItem
                >
                <DropdownMenuItem
                  @click="router.push('/register')"
                  class="rounded-xl p-3 font-bold cursor-pointer"
                  >إنشاء حساب</DropdownMenuItem
                >
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            class="md:hidden rounded-xl bg-slate-50"
          >
            <Menu class="w-6 h-6 text-slate-900" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          class="w-[300px] p-0 border-none bg-slate-50"
          dir="rtl"
        >
          <div class="flex flex-col h-full">
            <SheetHeader
              class="p-6 bg-white border-b border-slate-100 text-right"
            >
              <SheetTitle class="text-2xl font-black text-slate-900"
                >Delivery <span class="text-red-600">Shop</span></SheetTitle
              >
            </SheetHeader>

            <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <p
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2"
              >
                التنقل
              </p>
              <a
                v-for="route in routes"
                :key="route.url"
                :href="'#' + route.url"
                class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-700 font-bold hover:bg-white active:scale-95 transition-all"
                :class="
                  currentHashUrl === `#${route.url}`
                    ? 'bg-red-50 text-red-600 shadow-sm shadow-red-100'
                    : ''
                "
                @click="currentHashUrl = `#${route.url}`"
              >
                <component :is="route.icon" class="w-5 h-5" />
                {{ route.title }}
              </a>

              <div class="my-4 border-t border-slate-200/60"></div>

              <p
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2"
              >
                بوابة الشركاء
              </p>

              <div
                class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
              >
                <button
                  @click="driverOpen = !driverOpen"
                  class="w-full flex items-center justify-between p-4 font-bold text-slate-800"
                >
                  <div class="flex items-center gap-4">
                    <PackageCheck class="w-5 h-5 text-blue-500" /> الطيارين
                  </div>
                  <ChevronDown
                    :class="[
                      'w-4 h-4 transition-transform',
                      driverOpen ? 'rotate-180' : '',
                    ]"
                  />
                </button>
                <div v-if="driverOpen" class="bg-slate-50/50 p-2 space-y-1">
                  <template
                    v-if="auth.isAuthenticated && auth.type === 'driver'"
                  >
                    <button
                      @click="router.push('/driver-panel')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      الملف الشخصي
                    </button>
                    <button
                      @click="handleLogout"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-bold text-red-500"
                    >
                      تسجيل الخروج
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click="router.push('/')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      تسجيل الدخول
                    </button>
                    <button
                      @click="router.push('/register')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      تسجيل جديد
                    </button>
                  </template>
                </div>
              </div>

              <div
                class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 mt-3"
              >
                <button
                  @click="restaurantOpen = !restaurantOpen"
                  class="w-full flex items-center justify-between p-4 font-bold text-slate-800"
                >
                  <div class="flex items-center gap-4">
                    <Utensils class="w-5 h-5 text-emerald-500" /> المطاعم
                  </div>
                  <ChevronDown
                    :class="[
                      'w-4 h-4 transition-transform',
                      restaurantOpen ? 'rotate-180' : '',
                    ]"
                  />
                </button>
                <div v-if="restaurantOpen" class="bg-slate-50/50 p-2 space-y-1">
                  <template
                    v-if="auth.isAuthenticated && auth.type === 'restaurant'"
                  >
                    <button
                      @click="router.push('/restaurant/dashboard')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      لوحة التحكم
                    </button>
                    <button
                      @click="handleLogout"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-bold text-red-500"
                    >
                      تسجيل الخروج
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click="router.push('/restaurant')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      تسجيل دخول مطعم
                    </button>
                    <button
                      @click="router.push('/restaurant/register')"
                      class="w-full text-right p-3 rounded-xl hover:bg-white font-medium text-slate-600"
                    >
                      تسجيل مطعم جديد
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <div
              v-if="auth.isAuthenticated"
              class="p-4 bg-white border-t border-slate-100"
            >
              <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
                <div class="bg-slate-200 p-2 rounded-xl">
                  <UserCircle class="w-6 h-6 text-slate-600" />
                </div>
                <div class="flex-1 overflow-hidden">
                  <p class="font-bold text-slate-900 truncate">أهلاً بك</p>
                  <p class="text-xs text-slate-500 truncate capitalize">
                    {{ auth.type }} Account
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="handleLogout"
                  class="text-red-500"
                  ><LogOut class="w-5 h-5"
                /></Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </header>
</template>
