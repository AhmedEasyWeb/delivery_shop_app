<script setup lang="ts">
import { ref, onMounted } from "vue";
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
import { Geolocation } from "@capacitor/geolocation";

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
  logo: null as File | null,
  full_name: "",
  phone: "",
  password: "",
});

const logoPhotoPreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
  } catch {
    toast.error("فشل تحميل المدن");
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    const file = target.files[0];
    formData.value.logo = file;
    logoPhotoPreview.value = URL.createObjectURL(file);
  }
}
async function getLocation() {
  fetchingLocation.value = true;

  try {
    // Request permission (important for mobile)
    const permission = await Geolocation.requestPermissions();

    if (permission.location !== "granted") {
      toast.error("يجب السماح بالوصول إلى الموقع");
      fetchingLocation.value = false;
      return;
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);

    formData.value.location = `${lat}, ${lng}`;

    toast.success("تم تحديد موقعك بنجاح");
  } catch (error) {
    console.error(error);
    toast.error("فشل في الحصول على الموقع");
  } finally {
    fetchingLocation.value = false;
  }
}

async function handleRegister() {
  loading.value = true;

  try {
    const fd = new FormData();

    Object.entries(formData.value).forEach(([key, value]) => {
      if (value) fd.append(key, value as any);
    });

    fd.append("role", "owner");

    const res = await api.post("/restaurants/register", fd);

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
    <Card class="w-full max-w-2xl shadow-xl border-t-4 border-t-primary">
      <!-- Header -->
      <CardHeader class="text-center space-y-2">
        <CardTitle class="text-3xl font-bold"> تسجيل مطعم جديد </CardTitle>
        <CardDescription> ابدأ رحلتك وأضف مطعمك خلال دقائق </CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-10">
          <!-- Restaurant Info -->
          <div class="space-y-5">
            <div class="flex items-center gap-2 border-b pb-2">
              <Utensils class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg">بيانات المطعم</h3>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المطعم</Label>
                <Input v-model="formData.restaurant_name" required />
              </div>

              <div>
                <Label>المدينة</Label>
                <Select v-model="formData.restaurant_city">
                  <SelectTrigger>
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

            <div>
              <Label>العنوان</Label>
              <Textarea v-model="formData.address" required />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="relative">
                <FileText
                  class="absolute right-3 top-3 w-4 h-4 text-gray-400"
                />
                <Input
                  v-model="formData.commercial_register"
                  class="pr-9"
                  placeholder="السجل التجاري"
                />
              </div>

              <div class="flex gap-2">
                <div class="relative flex-1">
                  <MapPin
                    class="absolute right-3 top-3 w-4 h-4 text-gray-400"
                  />
                  <Input
                    v-model="formData.location"
                    readonly
                    class="pr-9 bg-gray-50"
                    placeholder="الموقع"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  @click="getLocation"
                  :disabled="fetchingLocation"
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

          <!-- Owner Info -->
          <div class="space-y-5">
            <div class="flex items-center gap-2 border-b pb-2">
              <User class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg">بيانات المالك</h3>
            </div>

            <Input v-model="formData.full_name" placeholder="الاسم بالكامل" />

            <div class="grid md:grid-cols-2 gap-4">
              <div class="relative">
                <Phone class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  v-model="formData.phone"
                  class="pr-9"
                  placeholder="رقم الهاتف"
                />
              </div>

              <div class="relative">
                <Lock class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="password"
                  v-model="formData.password"
                  class="pr-9"
                  placeholder="كلمة المرور"
                />
              </div>
            </div>
          </div>

          <!-- Logo Upload -->
          <div class="space-y-4">
            <Label class="text-lg font-semibold">شعار المطعم</Label>

            <div
              @click="fileInput?.click()"
              class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50"
            >
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handleFileUpload"
              />

              <template v-if="!logoPhotoPreview">
                <Upload class="mx-auto w-6 h-6 text-primary" />
                <p class="text-sm text-gray-500 mt-2">اضغط لرفع الشعار</p>
              </template>

              <img
                v-else
                :src="logoPhotoPreview"
                class="mx-auto h-32 object-contain"
              />
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="w-full h-12 text-lg font-bold"
            :disabled="loading"
          >
            <Loader v-if="loading" class="ml-2 animate-spin" />
            إنشاء الحساب
          </Button>
        </form>

        <!-- Footer -->
        <div class="mt-6 text-center text-sm text-gray-600">
          لديك حساب بالفعل؟
          <Button
            variant="link"
            class="text-primary font-bold"
            @click="router.push('/restaurant')"
          >
            تسجيل الدخول
          </Button>
        </div>
      </CardContent>
    </Card>
  </main>
</template>
