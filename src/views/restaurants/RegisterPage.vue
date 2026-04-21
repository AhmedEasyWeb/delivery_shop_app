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

function getLocation() {
  fetchingLocation.value = true;
  if (!navigator.geolocation) {
    toast.error("المتصفح لا يدعم تحديد الموقع");
    fetchingLocation.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      formData.value.location = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
      toast.success("تم تحديد موقعك");
      fetchingLocation.value = false;
    },
    () => {
      toast.error("فشل في الحصول على الموقع");
      fetchingLocation.value = false;
    },
  );
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
    if (formData.value.logo) fd.append("logo", formData.value.logo);

    fd.append("full_name", formData.value.full_name);
    fd.append("phone", formData.value.phone);
    fd.append("password", formData.value.password);
    fd.append("role", "owner");

    const res = await api.post("/restaurants/register", fd);
    console.log(res);

    if (res.status === 201) {
      toast.success("تم التسجيل بنجاح");
      router.push("/restaurant");
    } else {
      toast.error("حدث أمر غير متوقع، يرجى المحاولة لاحقاً");
    }
  } catch (err: any) {
    console.log(err);
    toast.error(err.response?.data?.message || "فشل تسجيل الحساب.");
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
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans"
    dir="rtl"
  >
    <Card class="w-full max-w-2xl shadow-lg border-t-4 border-t-primary">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-3xl font-bold tracking-tight"
          >تسجيل مطعم جديد</CardTitle
        >
        <CardDescription class="text-base"
          >أدخل بيانات المطعم وبيانات حساب المدير للبدء</CardDescription
        >
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b">
              <Utensils class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg">بيانات المطعم</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="restaurant_name">اسم المطعم</Label>
                <Input
                  v-model="formData.restaurant_name"
                  placeholder="مثال: مطعم البركة"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="city">المدينة</Label>
                <Select v-model="formData.restaurant_city" required>
                  <SelectTrigger
                    ><SelectValue placeholder="اختر المدينة"
                  /></SelectTrigger>
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
              <Label for="address">العنوان التفصيلي</Label>
              <Textarea
                v-model="formData.address"
                placeholder="الشارع، المنطقة، علامة مميزة"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>رقم السجل التجاري</Label>
                <Input
                  v-model="formData.commercial_register"
                  placeholder="12345678"
                  required
                />
              </div>
              <div class="space-y-2">
                <Label>الموقع الجغرافي</Label>
                <div class="flex gap-2">
                  <Input
                    v-model="formData.location"
                    readonly
                    placeholder="اضغط الزر"
                    class="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    @click="getLocation"
                    :disabled="fetchingLocation"
                  >
                    <Loader
                      v-if="fetchingLocation"
                      class="w-4 h-4 animate-spin"
                    />
                    <MapPin v-else class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 pt-4">
            <div class="flex items-center gap-2 pb-2 border-b">
              <User class="w-5 h-5 text-primary" />
              <h3 class="font-semibold text-lg">بيانات حساب المدير (المالك)</h3>
            </div>

            <div class="space-y-2">
              <Label>الاسم بالكامل</Label>
              <Input
                v-model="formData.full_name"
                placeholder="أدخل اسمك الشخصي"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>رقم الهاتف (اسم المستخدم)</Label>
                <div class="relative">
                  <Phone class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    v-model="formData.phone"
                    class="pr-9"
                    placeholder="05xxxxxxxx"
                    required
                  />
                </div>
              </div>
              <div class="space-y-2">
                <Label>كلمة المرور</Label>
                <div class="relative">
                  <Lock class="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    v-model="formData.password"
                    class="pr-9"
                    placeholder="********"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <Label class="text-lg font-semibold">شعار المطعم</Label>
            <div
              @click="fileInput?.click()"
              class="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              :class="logoPhotoPreview ? 'border-primary' : 'border-gray-300'"
            >
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handleFileUpload"
              />

              <template v-if="!logoPhotoPreview">
                <div class="bg-primary/10 p-3 rounded-full">
                  <Upload class="w-6 h-6 text-primary" />
                </div>
                <p class="text-sm text-gray-500">اضغط لرفع شعار المطعم</p>
              </template>

              <img
                v-else
                :src="logoPhotoPreview"
                class="h-32 w-32 object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            class="w-full h-12 text-lg font-bold"
            :disabled="loading"
          >
            <Loader v-if="loading" class="ml-2 w-5 h-5 animate-spin" />
            تأكيد التسجيل وإنشاء الحساب
          </Button>
        </form>

        <div class="mt-6 text-center text-gray-600">
          لديك حساب بالفعل؟
          <Button
            variant="link"
            @click="router.push('/restaurant')"
            class="font-bold text-primary px-1"
            >سجل دخولك من هنا</Button
          >
        </div>
      </CardContent>
    </Card>
  </div>
</template>
