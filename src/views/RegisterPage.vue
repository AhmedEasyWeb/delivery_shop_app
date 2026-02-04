<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Device } from "@capacitor/device";
import { MapPin, ArrowRight, Bike, Lock, Camera } from "lucide-vue-next";

const loading = ref(false);
const cities = ref<{ city_id: number; city_name: string }[]>([]);
const router = useRouter();
const authStore = useAuthStore();

async function getDeviceId() {
  const info = await Device.getId();
  toast.info(`Device UUID: ${JSON.stringify(info)}`);
  return info.identifier;
}

type DriverForm = {
  full_name: string;
  phone: string;
  city: string;
  id_number: string;
  device_id: string;
  driver_type: string;
  plate_number: string;
  password: string;
  first_license_photo: File | null;
  second_license_photo: File | null;
  third_license_photo: File | null;
  fourth_license_photo: File | null;
  fifth_license_photo: File | null;
  sixth_license_photo: File | null;
  seventh_license_photo: File | null;
};

type PhotoField =
  | "first_license_photo"
  | "second_license_photo"
  | "third_license_photo"
  | "fourth_license_photo"
  | "fifth_license_photo"
  | "sixth_license_photo"
  | "seventh_license_photo";

const form = ref<DriverForm>({
  full_name: "",
  phone: "",
  city: "",
  id_number: "",
  device_id: "",
  driver_type: "",
  plate_number: "",
  password: "",
  first_license_photo: null as File | null,
  second_license_photo: null as File | null,
  third_license_photo: null as File | null,
  fourth_license_photo: null as File | null,
  fifth_license_photo: null as File | null,
  sixth_license_photo: null as File | null,
  seventh_license_photo: null as File | null,
});

async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
  } catch (err) {
    toast.error("فشل تحميل المدن");
  }
}

const handleFile = (e: Event, field: PhotoField) => {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  form.value[field] = file;
};

const handleSubmit = async () => {
  loading.value = true;
  const deviceId = await getDeviceId();

  try {
    const fd = new FormData();

    const formKeys = Object.keys(form.value) as (keyof DriverForm)[];

    for (const key of formKeys) {
      const value = form.value[key];
      if (typeof value !== "string") continue;

      const map: Record<string, string> = {
        full_name: "driver_full_name",
        phone: "driver_phone",
        city: "driver_city",
        driver_type: "driver_type",
        id_number: "id_number",
        plate_number: "plate_number",
        password: "password",
      };

      fd.append(map[key] || key, value);
    }

    fd.append("device_id", deviceId);

    const photos: PhotoField[] = [
      "first_license_photo",
      "second_license_photo",
      "third_license_photo",
      "fourth_license_photo",
      "fifth_license_photo",
      "sixth_license_photo",
      "seventh_license_photo",
    ];

    for (const p of photos) {
      if (form.value[p]) {
        fd.append(p, form.value[p] as File);
      }
    }

    const response = await api.post(`/driver/register`, fd);

    if (response.data.success) {
      toast.success("تم التسجيل بنجاح");
    }
  } catch (err) {
    console.error(err);
    toast.error("لقد حدث خطأ ما");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await authStore.init();
  if (authStore.isAuthenticated) {
    router.push("/restaurant/dashboard");
  }
  fetchCities();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
    <div
      class="p-4 flex items-center gap-4 bg-white border-b border-slate-100 sticky top-0 z-20"
    >
      <Button
        variant="ghost"
        size="icon"
        @click="router.back()"
        class="rounded-full"
      >
        <ArrowRight class="w-6 h-6 text-slate-800" />
      </Button>
      <h1 class="text-xl font-black text-slate-900">حساب سائق جديد</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="p-5 space-y-6 pb-24">
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2 px-1">
          <User class="w-5 h-5 text-red-600" />
          <h2 class="font-black text-slate-800">المعلومات الشخصية</h2>
        </div>

        <div
          class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4"
        >
          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold"
              >الاسم الكامل (كما في البطاقة)</Label
            >
            <Input
              v-model="form.full_name"
              required
              class="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
            />
          </div>

          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold"
              >رقم الهاتف</Label
            >
            <Input
              v-model="form.phone"
              required
              type="tel"
              class="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
              dir="ltr"
            />
          </div>

          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold">المدينة</Label>
            <div class="relative">
              <select
                v-model="form.city"
                required
                class="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-sm appearance-none outline-none focus:ring-2 ring-red-500/20"
              >
                <option disabled value="">اختر مدينة</option>
                <option
                  v-for="city in cities"
                  :key="city.city_id"
                  :value="city.city_name"
                >
                  {{ city.city_name }}
                </option>
              </select>
              <MapPin
                class="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold"
              >الرقم القومي (14 رقم)</Label
            >
            <Input
              v-model="form.id_number"
              required
              class="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold font-mono"
            />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2 px-1">
          <Bike class="w-5 h-5 text-blue-600" />
          <h2 class="font-black text-slate-800">بيانات المركبة</h2>
        </div>
        <div
          class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4"
        >
          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold"
              >نوع المركبة</Label
            >
            <select
              v-model="form.driver_type"
              required
              class="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-sm"
            >
              <option disabled value="">اختر نوع المركبة</option>
              <option value="موتوسيكل">موتوسيكل</option>
              <option value="عجلة">عجلة</option>
              <option value="سيارة">سيارة</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <Label class="text-slate-500 mr-1 text-xs font-bold"
              >رقم اللوحة</Label
            >
            <Input
              v-model="form.plate_number"
              required
              placeholder="أ ب ج 1 2 3"
              class="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-center"
            />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2 px-1">
          <Lock class="w-5 h-5 text-emerald-600" />
          <h2 class="font-black text-slate-800">أمان الحساب</h2>
        </div>
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <Label class="text-slate-500 mr-1 text-xs font-bold"
            >كلمة المرور</Label
          >
          <Input
            v-model="form.password"
            required
            type="password"
            class="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
          />
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2 px-1">
          <Camera class="w-5 h-5 text-purple-600" />
          <h2 class="font-black text-slate-800">رفع المستندات والطلب</h2>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="(label, key) in {
              first_license_photo: 'البطاقة (أمام)',
              second_license_photo: 'البطاقة (خلف)',
              third_license_photo: 'الرخصة (أمام)',
              fourth_license_photo: 'الرخصة (خلف)',
              fifth_license_photo: 'المركبة (1)',
              sixth_license_photo: 'المركبة (2)',
              seventh_license_photo: 'صورة شخصية',
            }"
            :key="key"
          >
            <label
              v-if="
                !(
                  form.driver_type === 'عجلة' &&
                  key.includes('license') &&
                  !key.includes('first') &&
                  !key.includes('second')
                )
              "
              class="relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-all active:scale-95"
              :class="
                form[key as PhotoField]
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white'
              "
            >
              <input
                type="file"
                class="hidden"
                @change="(e) => handleFile(e, key as PhotoField)"
                accept="image/*"
              />
              <div
                v-if="form[key as PhotoField]"
                class="flex flex-col items-center animate-in zoom-in-75"
              >
                <CheckCircle2 class="w-6 h-6 text-emerald-600 mb-1" />
                <span
                  class="text-[10px] font-black text-emerald-700 text-center leading-tight"
                  >تم الرفع</span
                >
              </div>
              <div v-else class="flex flex-col items-center text-slate-400">
                <Upload class="w-6 h-6 mb-1 opacity-50" />
                <span class="text-[10px] font-bold text-center leading-tight">{{
                  label
                }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div
        class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-30"
      >
        <Button
          type="submit"
          class="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 text-lg font-black"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin ml-2" />
          {{ loading ? "جاري الإرسال..." : "إرسال طلب الانضمام" }}
        </Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 1rem center;
  background-size: 1.2em;
}
</style>
