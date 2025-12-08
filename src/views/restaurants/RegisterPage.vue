<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { Loader } from "lucide-vue-next";
import { Geolocation } from "@capacitor/geolocation";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import api from "@/api/axios";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const cities = ref<{ city_id: number; city_name: string }[]>([]);

const fetchingLocation = ref(false);

async function getLocation() {
  fetchingLocation.value = true;

  try {
    const perm = await Geolocation.requestPermissions();

    if (perm.location !== "granted") {
      toast.error("يجب السماح باستخدام الموقع");
      fetchingLocation.value = false;
      return;
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);

    formData.value.location = `${lat}, ${lng}`;
    toast.success("تم جلب موقعك بنجاح");
  } catch (err) {
    console.error(err);
    toast.error("فشل في الحصول على الموقع");
  } finally {
    fetchingLocation.value = false;
  }
}

const formData = ref({
  restaurant_name: "",
  restaurant_city: "",
  address: "",
  commercial_register: "",
  location: "",
  password: "",
  logo: null as File | null,
});

const logoPhotoPreview = ref<string | null>(null);

async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
  } catch (err) {
    toast.error("فشل تحميل المدن");
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    formData.value.logo = file;
    logoPhotoPreview.value = URL.createObjectURL(file);
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append("restaurant_name", formData.value.restaurant_name);
    fd.append("restaurant_city", formData.value.restaurant_city);
    fd.append("address", formData.value.address);
    fd.append("commercial_register", formData.value.commercial_register);
    fd.append("location", formData.value.location);
    fd.append("password", formData.value.password);
    if (formData.value.logo) {
      fd.append("logo", formData.value.logo);
    }

    const res = await api.post("/restaurants/register", fd);

    if (res.status < 200 || res.status >= 300) {
      throw new Error("خطأ في إرسال بيانات التسجيل");
    }

    toast.success("تم تسجيل حسابك بنجاح!");
    router.push("/");
  } catch (err: any) {
    toast.error(err.message || "فشل تسجيل الحساب.");
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push("/restaurant");
}

onMounted(async () => {
  await authStore.init();
  if (authStore.isAuthenticated) {
    router.push("/restaurant/dashboard");
  }
  fetchCities();
});

watch(
  () => formData.value.logo,
  (_file, oldFile) => {
    if (logoPhotoPreview.value && oldFile) {
      URL.revokeObjectURL(logoPhotoPreview.value);
    }
  }
);
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">تسجيل حساب</CardTitle>
        <CardDescription
          >اعمل حساب جديد علشان تبدأ تستخدم التطبيق</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid gap-2">
            <Label for="restaurant_name">اسم المطعم</Label>
            <Input
              id="restaurant_name"
              type="text"
              placeholder="Pizza place"
              v-model="formData.restaurant_name"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="address">العنوان</Label>
            <Textarea
              id="address"
              placeholder=" اكتب عنوان المطعم"
              v-model="formData.address"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div class="grid gap-2">
            <Label>الإحداثيات (Location)</Label>
            <div class="flex items-center gap-2">
              <Input
                type="text"
                v-model="formData.location"
                readonly
                placeholder="اضغط زر تحديد الموقع"
                class="flex-1"
              />

              <Button
                type="button"
                @click="getLocation"
                :disabled="fetchingLocation"
              >
                <Loader v-if="fetchingLocation" class="w-4 h-4 animate-spin" />
                <span v-else>حدد موقعي</span>
              </Button>
            </div>
          </div>

          <div class="grid gap-2">
            <Label>كلمة المرور</Label>
            <Input
              type="password"
              placeholder="********"
              v-model="formData.password"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="commercial_register">رقم السجل التجاري</Label>
            <Input
              id="commercial_register"
              type="text"
              placeholder="123456789"
              v-model="formData.commercial_register"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="city">المدينة</Label>
            <Select v-model="formData.restaurant_city" required>
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
          </div>

          <div class="grid gap-2">
            <Label for="logo_image">صورة الشعار </Label>
            <Input
              id="logo_image"
              type="file"
              accept="image/*"
              @change="handleFileUpload"
              required
            />
            <div v-if="logoPhotoPreview" class="mt-2">
              <img
                :src="logoPhotoPreview"
                alt="معاينة صورة الرخصة"
                class="max-w-full h-auto rounded-md"
              />
            </div>
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span v-else="loading"> تسجيل </span>
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          عندك حساب قبل كده؟
          <Button variant="link" @click="goToLogin" class="p-0 h-auto">
            سجل دخول
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
