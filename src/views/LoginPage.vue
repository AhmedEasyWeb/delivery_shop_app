<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
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
const error = computed(() => authStore.error);

async function getDeviceId() {
  const info = await Device.getId();
  toast.info(`Device UUID: ${info}`);
  return info;
}

onMounted(async () => {
  await authStore.checkSession();
  await authStore.checkRestaurantSession();

  if (authStore.isAuthenticated) {
    if (authStore.type === "driver") {
      router.push("/driver-panel");
    } else if (authStore.type === "restaurant") {
      router.push("/restaurant/dashboard");
    }
  }
});

async function handleLogin() {
  try {
    let selfieBlob: Blob | null = null;

    if (Capacitor.getPlatform() === "web") {
      fileInput.value?.click();

      const file = await new Promise<File | null>((resolve) => {
        fileInput.value!.onchange = () => {
          resolve(fileInput.value!.files?.[0] || null);
        };
      });

      if (!file) {
        toast.error("لازم تختار صورة علشان تسجل الدخول.");
        return;
      }

      selfieBlob = file;
    } else {
      const photo = await Camera.getPhoto({
        quality: 40,
        resultType: CameraResultType.Uri,
        allowEditing: false,
        source: CameraSource.Camera,
        promptLabelHeader: "تأكيد الهوية بالسيلفي",
      });

      if (!photo.path) {
        alert("لازم تاخد سيلفي علشان تسجل الدخول.");
        return;
      }

      const response = await fetch(photo.webPath!);
      selfieBlob = await response.blob();
    }

    const deviceId = await getDeviceId();

    const formData = new FormData();
    formData.append("phone", phone.value);
    formData.append("password", password.value);
    formData.append("selfie", selfieBlob, "selfie.jpg");
    formData.append("device_id", String(deviceId));

    if (isFreelancer.value === "yes") {
      formData.append("shift", shift.value.toString());
      formData.append("is_freelancer", "1");
    } else {
      formData.append("is_freelancer", "0");
    }

    const success = await authStore.login(formData);

    if (success) {
      router.push("/driver-panel");
    } else {
      alert(authStore.error || "فشل تسجيل الدخول. تأكد من البيانات والسيلفي.");
    }
  } catch (err) {
    console.error("Login error:", err);
    toast.error(error);
  }
}

function goToRegister() {
  router.push("/register");
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 mt-2"
  >
    <router-link
      to="/landing"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 left-4 hover:underline"
    >
      <ArrowLeft class="w-4 h-4 md:w-6 md:h-6" />
      <p>الصفحة الرئيسية</p>
    </router-link>
    <router-link
      to="/restaurant"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 right-4 hover:underline"
    >
      <p>المطعم</p>
      <ArrowRight class="w-4 h-4 md:w-6 md:h-6" />
    </router-link>

    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">تسجيل الدخول الطيار</CardTitle>
        <CardDescription>
          اكتب بياناتك وخد سيلفي علشان تدخل على لوحة السواقين
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="grid gap-2">
            <Label for="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="text"
              placeholder="اكتب رقم الهاتف"
              v-model="phone"
              required
            />
          </div>
          <input type="file" accept="image/*" ref="fileInput" class="hidden" />
          <div class="grid gap-2">
            <Label>نوع السائق</Label>
            <Select v-model="isFreelancer">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="اختار النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">سائق عادي (شيفت ثابت)</SelectItem>
                <SelectItem value="yes">مستقل (يحدد الوردية)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="isFreelancer === 'yes'" class="grid gap-2">
            <Label for="shift">الوردية</Label>
            <Select v-model="shift">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="اختار الوردية" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel class="text-gray-400">الوردية</SelectLabel>
                <SelectItem :value="8">وردية ٨ ساعات</SelectItem>
                <SelectItem :value="10">وردية ١٠ ساعات</SelectItem>
                <SelectItem :value="12">وردية ١٢ ساعة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label for="password">كلمة السر</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              v-model="password"
              required
            />
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span>تسجيل الدخول</span>
          </Button>
        </form>

        <div class="mt-4 text-center text-sm">
          معندكش حساب؟
          <Button variant="link" @click="goToRegister" class="p-0 h-auto">
            سجل دلوقتي
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
