<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const loading = ref(false);
const cities = ref<{ city_id: number; city_name: string }[]>([]);
const router = useRouter();
const authStore = useAuthStore();

type DriverForm = {
  full_name: string;
  phone: string;
  city: string;
  id_number: string;
  driver_type: string;
  plate_number: string;
  password: string;
  first_license_photo: File | null;
  second_license_photo: File | null;
  third_license_photo: File | null;
  fourth_license_photo: File | null;
};

type PhotoField =
  | "first_license_photo"
  | "second_license_photo"
  | "third_license_photo"
  | "fourth_license_photo";

const form = ref<DriverForm>({
  full_name: "",
  phone: "",
  city: "",
  id_number: "",
  driver_type: "",
  plate_number: "",
  password: "",
  first_license_photo: null as File | null,
  second_license_photo: null as File | null,
  third_license_photo: null as File | null,
  fourth_license_photo: null as File | null,
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

    const photos: PhotoField[] = [
      "first_license_photo",
      "second_license_photo",
      "third_license_photo",
      "fourth_license_photo",
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
  <form
    @submit.prevent
    class="min-h-screen bg-background p-5 flex flex-col gap-6"
  >
    <h1 class="text-2xl font-bold text-foreground text-center">
      إنشاء حساب سائق
    </h1>

    <div
      class="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm"
    >
      <h2 class="font-semibold text-foreground text-sm">المعلومات الشخصية</h2>

      <div class="space-y-1">
        <Label>الاسم الكامل</Label>
        <Input v-model="form.full_name" required />
      </div>

      <div class="space-y-1">
        <Label>رقم الهاتف</Label>
        <Input v-model="form.phone" required type="tel" />
      </div>

      <div class="space-y-1">
        <Label>المدينة</Label>
        <select
          v-model="form.city"
          required
          class="w-full h-11 border border-border rounded-md px-3 bg-background text-sm"
        >
          <option disabled value="">اختر مدينة</option>
          <option v-for="city in cities" :key="city.city_id">
            {{ city.city_name }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <Label>الرقم القومي</Label>
        <Input v-model="form.id_number" required />
      </div>
    </div>

    <div
      class="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm"
    >
      <h2 class="font-semibold text-foreground text-sm">بيانات المركبة</h2>

      <div class="space-y-1">
        <Label>نوع السائق</Label>
        <select
          v-model="form.driver_type"
          required
          class="w-full h-11 border border-border rounded-md px-3 bg-background text-sm"
        >
          <option disabled value="">اختر نوع السائق</option>
          <option value="موتوسيكل">موتوسيكل</option>
          <option value="عجلة">عجلة</option>
          <option value="سيارة">سيارة</option>
        </select>
      </div>

      <div class="space-y-1">
        <Label>رقم اللوحة</Label>
        <Input v-model="form.plate_number" required class="font-mono" />
      </div>
    </div>

    <div
      class="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm"
    >
      <h2 class="font-semibold text-foreground text-sm">
        البيانات الخاصة بالحساب
      </h2>

      <div class="space-y-1">
        <Label>كلمة المرور</Label>
        <Input v-model="form.password" required type="password" />
      </div>
    </div>

    <div
      class="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm"
    >
      <h2 class="font-semibold text-foreground text-sm">صور الرخص</h2>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <Label>الصورة 1</Label>
          <input
            type="file"
            required
            class="w-full border border-border rounded-md px-3 py-2 text-sm"
            @change="(e) => handleFile(e, 'first_license_photo')"
          />
        </div>

        <div v-if="form.driver_type !== 'عجلة'" class="space-y-1">
          <Label>الصورة 2</Label>
          <input
            type="file"
            required
            class="w-full border border-border rounded-md px-3 py-2 text-sm"
            @change="(e) => handleFile(e, 'second_license_photo')"
          />
        </div>

        <div v-if="form.driver_type !== 'عجلة'" class="space-y-1">
          <Label>الصورة 3</Label>
          <input
            type="file"
            required
            class="w-full border border-border rounded-md px-3 py-2 text-sm"
            @change="(e) => handleFile(e, 'third_license_photo')"
          />
        </div>

        <div v-if="form.driver_type !== 'عجلة'" class="space-y-1">
          <Label>الصورة 4</Label>
          <input
            type="file"
            required
            class="w-full border border-border rounded-md px-3 py-2 text-sm"
            @change="(e) => handleFile(e, 'fourth_license_photo')"
          />
        </div>
      </div>
    </div>

    <Button
      class="w-full h-11 text-sm font-bold"
      :disabled="loading"
      @click="handleSubmit"
    >
      {{ loading ? "جاري التسجيل..." : "تسجيل الحساب" }}
    </Button>
  </form>
</template>
