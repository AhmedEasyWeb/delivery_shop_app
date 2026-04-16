<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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

// UI States
const loading = ref(false);
const fetchingLocation = ref(false);
const cities = ref<{ city_id: number; city_name: string }[]>([]);

// Form Data
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

// Logo Handling
const logoBlob = ref<Blob | null>(null);
const logoPhotoPreview = ref<string | null>(null);

/**
 * Fetches available cities for the dropdown
 */
async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
  } catch {
    toast.error("فشل تحميل المدن");
  }
}

/**
 * Opens native camera/gallery to pick a restaurant logo
 */
async function pickLogo() {
  try {
    const image = await Camera.getPhoto({
      quality: 70, // Slightly lower quality for faster uploads
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Allows user to choose between Camera or Photos
    });

    if (image.base64String) {
      const mimeType = `image/${image.format}`;

      // Convert Base64 to Blob
      const byteChars = atob(image.base64String);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      logoBlob.value = new Blob([byteNumbers], { type: mimeType });

      // Set Preview for UI
      logoPhotoPreview.value = `data:${mimeType};base64,${image.base64String}`;
      toast.success("تم اختيار الشعار بنجاح");
    }
  } catch (err: any) {
    if (err?.message !== "User cancelled photos app") {
      console.error("Camera Error:", err);
      toast.error("فشل في اختيار الصورة");
    }
  }
}

/**
 * Gets GPS coordinates using Capacitor Geolocation
 */
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

/**
 * Handles the multi-part form submission
 */
async function handleRegister() {
  // Simple validation check
  if (!formData.value.location) {
    toast.error("يرجى تحديد موقع المطعم على الخريطة");
    return;
  }

  loading.value = true;
  try {
    const fd = new FormData();

    // Append text fields
    Object.entries(formData.value).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });

    fd.append("role", "owner");

    // Append logo if exists
    if (logoBlob.value) {
      fd.append("logo", logoBlob.value, "restaurant_logo.jpg");
    }

    const res = await api.post("/restaurants/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 201 || res.status === 200) {
      toast.success("تم تسجيل مطعمك بنجاح");
      router.push("/restaurant/login"); // Or wherever your success route is
    }
  } catch (err: any) {
    console.error("Registration Error:", err);
    toast.error(
      err.response?.data?.message || "فشل تسجيل الحساب، يرجى المحاولة لاحقاً",
    );
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await authStore.init();
  if (authStore.isAuthenticated) {
    router.push("/restaurant/dashboard");
  } else {
    fetchCities();
  }
});
</script>
<template>
  <main
    dir="rtl"
    class="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8"
  >
    <Card
      class="w-full max-w-2xl shadow-2xl border-t-4 border-t-primary bg-white text-slate-900"
    >
      <CardHeader class="text-center space-y-2 pb-2">
        <div
          class="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2"
        >
          <Utensils class="w-8 h-8 text-primary" />
        </div>
        <CardTitle class="text-3xl font-bold text-slate-900"
          >تسجيل مطعم جديد</CardTitle
        >
        <CardDescription class="text-slate-500 text-lg">
          انضم إلينا وابدأ في استقبال الطلبات اليوم
        </CardDescription>
      </CardHeader>

      <CardContent class="pt-6">
        <form @submit.prevent="handleRegister" class="space-y-8">
          <div
            class="flex flex-col items-center justify-center space-y-4 pb-6 border-b border-dashed"
          >
            <div
              @click="pickLogo"
              class="relative w-32 h-32 rounded-full border-4 border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-all overflow-hidden bg-slate-50 flex items-center justify-center"
            >
              <img
                v-if="logoPhotoPreview"
                :src="logoPhotoPreview"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-center space-y-1 p-2">
                <Upload class="w-8 h-8 mx-auto text-slate-400" />
                <span class="text-xs text-slate-500 font-medium"
                  >شعار المطعم</span
                >
              </div>
              <div
                class="absolute bottom-0 inset-x-0 bg-black/40 py-1 text-[10px] text-white text-center"
              >
                تعديل
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-2 text-primary">
              <Utensils class="w-5 h-5" />
              <h3 class="font-bold text-lg">بيانات المطعم</h3>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label class="text-slate-700 font-medium">اسم المطعم</Label>
                <Input
                  v-model="formData.restaurant_name"
                  required
                  placeholder="مثال: مطعم السعادة"
                  class="h-11 bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div class="space-y-2">
                <Label class="text-slate-700 font-medium">المدينة</Label>
                <Select v-model="formData.restaurant_city">
                  <SelectTrigger class="h-11 bg-white border-slate-200">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="city in cities"
                      :key="city.city_id"
                      :value="city.city_name"
                    >
                      {{ city.city_name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-2">
              <Label class="text-slate-700 font-medium">العنوان بالتفصيل</Label>
              <Textarea
                v-model="formData.address"
                required
                placeholder="اسم الشارع، علامة مميزة..."
                class="min-h-[80px] bg-white border-slate-200"
              />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label class="text-slate-700 font-medium"
                  >رقم السجل التجاري</Label
                >
                <div class="relative">
                  <FileText
                    class="absolute right-3 top-3 w-5 h-5 text-slate-400"
                  />
                  <Input
                    v-model="formData.commercial_register"
                    class="pr-10 h-11 bg-white border-slate-200"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-slate-700 font-medium"
                  >الموقع الجغرافي (GPS)</Label
                >
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <MapPin
                      class="absolute right-3 top-3 w-5 h-5 text-slate-400"
                    />
                    <Input
                      v-model="formData.location"
                      readonly
                      placeholder="اضغط للتحديد"
                      class="pr-10 h-11 bg-slate-50 border-slate-200 cursor-not-allowed text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    @click="getLocation"
                    :disabled="fetchingLocation"
                    class="h-11 px-4 shrink-0 transition-colors"
                    :class="
                      formData.location
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : ''
                    "
                  >
                    <Loader
                      v-if="fetchingLocation"
                      class="animate-spin w-5 h-5"
                    />
                    <MapPin v-else class="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-2 text-primary">
              <User class="w-5 h-5" />
              <h3 class="font-bold text-lg">بيانات المدير المسؤول</h3>
            </div>

            <div class="space-y-2">
              <Label class="text-slate-700 font-medium">الاسم بالكامل</Label>
              <div class="relative">
                <User class="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  v-model="formData.full_name"
                  placeholder="الاسم الثلاثي"
                  class="pr-10 h-11 bg-white border-slate-200"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label class="text-slate-700 font-medium"
                  >رقم الهاتف (لتسجيل الدخول)</Label
                >
                <div class="relative">
                  <Phone
                    class="absolute right-3 top-3 w-5 h-5 text-slate-400"
                  />
                  <Input
                    v-model="formData.phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    class="pr-10 h-11 bg-white border-slate-200"
                    dir="ltr"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-slate-700 font-medium">كلمة المرور</Label>
                <div class="relative">
                  <Lock class="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                  <Input
                    v-model="formData.password"
                    type="password"
                    placeholder="••••••••"
                    class="pr-10 h-11 bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6">
            <Button
              type="submit"
              class="w-full h-14 text-lg font-bold shadow-lg transition-all active:scale-[0.98]"
              :disabled="loading"
            >
              <template v-if="loading">
                <Loader class="ml-2 animate-spin w-5 h-5" />
                جاري إنشاء الحساب...
              </template>
              <template v-else> إنشاء حساب المطعم </template>
            </Button>
            <p class="text-center text-xs text-slate-400 mt-4">
              بالتسجيل أنت توافق على شروط الخدمة وسياسة الخصوصية
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
