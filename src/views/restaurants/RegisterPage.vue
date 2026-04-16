<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader,
  MapPin,
  Upload,
  Utensils,
  User,
  Phone,
  Lock,
  FileText,
} from "lucide-vue-next";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import api from "@/api/axios";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const cities = ref<{ city_id: number; city_name: string }[]>([]);
const fetchingLocation = ref(false);

const formData = ref({
  restaurant_name: "",
  restaurant_city: "",
  address: "",
  commercial_register: "",
  location: "",
  full_name: "",
  phone: "",
  password: "",
});

const logoBase64 = ref<string | null>(null);
const logoBlob = ref<Blob | null>(null);
const logoPhotoPreview = ref<string | null>(null);

async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
  } catch {
    toast.error("فشل تحميل المدن");
  }
}

async function pickLogo() {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    if (!image.base64String) return;

    const mimeType = `image/${image.format}`;
    logoBase64.value = image.base64String;

    const byteChars = atob(image.base64String);
    const byteNumbers = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    logoBlob.value = new Blob([byteNumbers], { type: mimeType });

    logoPhotoPreview.value = `data:${mimeType};base64,${image.base64String}`;
  } catch (err: any) {
    if (err?.message !== "User cancelled photos app") {
      toast.error("فشل في اختيار الصورة");
    }
  }
}

async function getLocation() {
  fetchingLocation.value = true;
  try {
    // 1. Check current permission status first
    const check = await Geolocation.checkPermissions();

    if (check.location !== "granted") {
      const request = await Geolocation.requestPermissions();
      if (request.location !== "granted") {
        toast.error("يجب السماح بالوصول إلى الموقع من إعدادات الهاتف");
        return;
      }
    }

    // 2. Get position with more relaxed settings
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, // Set to false if you are testing indoors/on slow GPS
      timeout: 15000, // Increase to 15 seconds
      maximumAge: 3000, // Accept a cached location from the last 3 seconds
    });

    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);

    formData.value.location = `${lat}, ${lng}`;
    toast.success("تم تحديد موقعك بنجاح");
  } catch (error: any) {
    console.error("Location Error:", error);

    // Specific error handling
    if (error.code === "3" || error.message?.includes("timeout")) {
      toast.error("انتهى الوقت، تأكد من تشغيل الـ GPS");
    } else {
      toast.error("فشل في الحصول على الموقع، تأكد من الصلاحيات");
    }
  } finally {
    fetchingLocation.value = false;
  }
}
async function handleRegister() {
  loading.value = true;
  try {
    const fd = new FormData();

    Object.entries(formData.value).forEach(([key, value]) => {
      if (value) fd.append(key, value as string);
    });

    fd.append("role", "owner");

    if (logoBlob.value) {
      fd.append("logo", logoBlob.value, "logo.jpg");
    }

    const res = await api.post("/restaurants/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 201) {
      toast.success("تم التسجيل بنجاح");
      router.push("/restaurant");
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || "فشل تسجيل الحساب");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await authStore.init();
  if (authStore.isAuthenticated) router.push("/restaurant/dashboard");
  fetchCities();
});
</script>
<template>
  <main
    dir="rtl"
    class="min-h-screen flex items-center justify-center bg-slate-50 p-4"
  >
    <Card
      class="w-full max-w-2xl shadow-xl border-t-4 border-t-primary bg-white text-slate-900"
    >
      <CardHeader class="text-center space-y-2">
        <CardTitle class="text-3xl font-bold text-slate-900"
          >تسجيل مطعم جديد</CardTitle
        >
        <CardDescription class="text-slate-500"
          >ابدأ رحلتك وأضف مطعمك خلال دقائق</CardDescription
        >
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-center gap-2 border-b pb-2">
              <Utensils class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg text-slate-800">
                بيانات المطعم
              </h3>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label class="text-slate-700">اسم المطعم</Label>
                <Input
                  v-model="formData.restaurant_name"
                  required
                  class="bg-white text-slate-900 border-slate-200 focus:ring-primary"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-slate-700">المدينة</Label>
                <Select v-model="formData.restaurant_city">
                  <SelectTrigger
                    class="bg-white text-slate-900 border-slate-200"
                  >
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="city in cities"
                      :key="city.city_id"
                      :value="city.city_name"
                      >{{ city.city_name }}</SelectItem
                    >
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-1">
              <Label class="text-slate-700">العنوان</Label>
              <Textarea
                v-model="formData.address"
                required
                class="bg-white text-slate-900 border-slate-200"
              />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="relative space-y-1">
                <Label class="text-slate-700">السجل التجاري</Label>
                <div class="relative">
                  <FileText
                    class="absolute right-3 top-3 w-4 h-4 text-gray-400"
                  />
                  <Input
                    v-model="formData.commercial_register"
                    class="pr-9 bg-white text-slate-900 border-slate-200"
                    placeholder="السجل التجاري"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <Label class="text-slate-700">الموقع الجغرافي</Label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <MapPin
                      class="absolute right-3 top-3 w-4 h-4 text-gray-400"
                    />
                    <Input
                      v-model="formData.location"
                      readonly
                      class="pr-9 bg-slate-100 text-slate-900 border-slate-200 cursor-not-allowed"
                      placeholder="الموقع"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    @click="getLocation"
                    :disabled="fetchingLocation"
                    class="shrink-0"
                  >
                    <Loader
                      v-if="fetchingLocation"
                      class="animate-spin w-4 h-4"
                    />
                    <MapPin v-else class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 pt-4">
            <div class="flex items-center gap-2 border-b pb-2">
              <User class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg text-slate-800">
                بيانات المالك
              </h3>
            </div>

            <div class="space-y-1">
              <Label class="text-slate-700">الاسم بالكامل</Label>
              <Input
                v-model="formData.full_name"
                class="bg-white text-slate-900"
              />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="relative space-y-1">
                <Label class="text-slate-700">رقم الهاتف</Label>
                <div class="relative">
                  <Phone class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    v-model="formData.phone"
                    class="pr-9 bg-white text-slate-900"
                    dir="ltr"
                  />
                </div>
              </div>
              <div class="relative space-y-1">
                <Label class="text-slate-700">كلمة المرور</Label>
                <div class="relative">
                  <Lock class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    v-model="formData.password"
                    class="pr-9 bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
