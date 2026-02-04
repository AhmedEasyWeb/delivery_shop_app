<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  Camera,
  Smartphone,
  UserCircle,
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import {
  Camera as CapCamera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { useAuthStore } from "@/stores/auth";
import { Capacitor } from "@capacitor/core";
import { toast } from "vue-sonner";
import { Device } from "@capacitor/device";

const phone = ref("");
const password = ref("");
const shift = ref(8);
const isFreelancer = ref("no");
const fileInput = ref<HTMLInputElement | null>(null);

const router = useRouter();
const authStore = useAuthStore();
const loading = computed(() => authStore.isLoading);

async function getDeviceId() {
  const info = await Device.getId();
  return info.identifier;
}

onMounted(async () => {
  await authStore.checkSession();
  await authStore.checkRestaurantSession();

  if (authStore.isAuthenticated) {
    if (authStore.type === "driver") router.push("/driver-panel");
    else if (authStore.type === "restaurant")
      router.push("/restaurant/dashboard");
  }
});

async function handleLogin() {
  try {
    let selfieBlob: Blob | null = null;

    if (Capacitor.getPlatform() === "web") {
      fileInput.value?.click();
      const file = await new Promise<File | null>((resolve) => {
        fileInput.value!.onchange = () =>
          resolve(fileInput.value!.files?.[0] || null);
      });
      if (!file) {
        toast.error("لازم تختار صورة للسيلفي");
        return;
      }
      selfieBlob = file;
    } else {
      const photo = await CapCamera.getPhoto({
        quality: 50,
        resultType: CameraResultType.Uri,
        allowEditing: false,
        source: CameraSource.Camera,
        promptLabelHeader: "تأكيد الهوية بالسيلفي",
      });

      if (!photo.path) {
        toast.error("لازم تاخد سيلفي علشان تسجل الدخول.");
        return;
      }

      const response = await fetch(photo.webPath!);
      selfieBlob = await response.blob();
    }

    const deviceId = await getDeviceId();
    const formData = new FormData();
    formData.append("phone", phone.value);
    formData.append("password", password.value);
    formData.append("selfie", selfieBlob!, "selfie.jpg");
    formData.append("device_id", String(deviceId));
    formData.append("is_freelancer", isFreelancer.value === "yes" ? "1" : "0");
    if (isFreelancer.value === "yes")
      formData.append("shift", shift.value.toString());

    const success = await authStore.login(formData);
    if (success) router.push("/driver-panel");
  } catch (err) {
    toast.error("حدث خطأ أثناء تسجيل الدخول");
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col font-sans" dir="rtl">
    <div
      class="p-4 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-10"
    >
      <Button
        variant="ghost"
        size="icon"
        @click="router.push('/landing')"
        class="rounded-full"
      >
        <ArrowRight class="w-6 h-6 text-slate-800" />
      </Button>
      <h1 class="font-black text-lg text-slate-900">دخول الطيارين</h1>
      <Button
        variant="ghost"
        size="sm"
        @click="router.push('/restaurant')"
        class="text-red-600 font-bold"
      >
        المطاعم
      </Button>
    </div>

    <div class="px-6 pt-10 pb-6">
      <div
        class="bg-red-50 w-16 h-16 rounded-[22px] flex items-center justify-center mb-6"
      >
        <Smartphone class="w-8 h-8 text-red-600" />
      </div>
      <h2 class="text-3xl font-black text-slate-900 mb-2">أهلاً بك مجدداً</h2>
      <p class="text-slate-500 font-medium leading-relaxed">
        سجل دخولك وابدأ رحلة التوصيل. سيُطلب منك أخذ صورة سيلفي سريعة للتأكد من
        هويتك.
      </p>
    </div>

    <div class="flex-1 px-6 space-y-6">
      <form @submit.prevent="handleLogin" class="space-y-5">
        <div class="space-y-1.5">
          <Label for="phone" class="mr-2 text-slate-700 font-bold text-sm"
            >رقم الهاتف</Label
          >
          <div class="relative">
            <Input
              id="phone"
              type="tel"
              v-model="phone"
              placeholder="07xx xxx xxxx"
              class="h-14 rounded-2xl bg-slate-50 border-none px-5 text-lg font-bold focus-visible:ring-red-500 transition-all"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="mr-2 text-slate-700 font-bold text-sm">نوع العمل</Label>
          <Select v-model="isFreelancer">
            <SelectTrigger
              class="h-14 rounded-2xl bg-slate-50 border-none px-5 text-right font-bold text-slate-800 focus:ring-red-500"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="rounded-2xl border-none shadow-xl">
              <SelectItem value="no" class="p-3 font-bold"
                >سائق (شيفت ثابت)</SelectItem
              >
              <SelectItem value="yes" class="p-3 font-bold"
                >مستقل (فريلانسر)</SelectItem
              >
            </SelectContent>
          </Select>
        </div>

        <div
          v-if="isFreelancer === 'yes'"
          class="space-y-1.5 animate-in fade-in slide-in-from-top-2"
        >
          <Label class="mr-2 text-slate-700 font-bold text-sm"
            >مدة الوردية</Label
          >
          <Select v-model="shift">
            <SelectTrigger
              class="h-14 rounded-2xl bg-slate-100 border-none px-5 text-right font-bold"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="rounded-2xl">
              <SelectItem :value="8" class="font-bold">8 ساعات</SelectItem>
              <SelectItem :value="10" class="font-bold">10 ساعات</SelectItem>
              <SelectItem :value="12" class="font-bold">12 ساعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="password" class="mr-2 text-slate-700 font-bold text-sm"
            >كلمة السر</Label
          >
          <Input
            id="password"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="h-14 rounded-2xl bg-slate-50 border-none px-5 text-lg focus-visible:ring-red-500"
          />
        </div>

        <input type="file" accept="image/*" ref="fileInput" class="hidden" />

        <div class="pt-4">
          <Button
            type="submit"
            class="w-full h-15 rounded-[22px] bg-red-600 hover:bg-red-700 text-white text-xl font-black shadow-lg shadow-red-100 active:scale-[0.98] transition-all py-7"
            :disabled="loading"
          >
            <template v-if="loading">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              جاري الدخول...
            </template>
            <template v-else>
              دخول واستلام الصورة
              <Camera class="mr-2 w-5 h-5" />
            </template>
          </Button>
        </div>
      </form>

      <div class="pb-10">
        <button
          @click="router.push('/register')"
          class="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group"
        >
          <div class="flex items-center gap-4">
            <div class="bg-white p-2 rounded-xl shadow-sm">
              <UserCircle class="w-6 h-6 text-slate-600" />
            </div>
            <div class="text-right">
              <p class="font-black text-slate-900">ليس لديك حساب؟</p>
              <p class="text-xs text-slate-500 font-bold">انضم لعائلتنا الآن</p>
            </div>
          </div>
          <ChevronRight
            class="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-15 {
  height: 3.75rem;
}
</style>
