<script lang="ts" setup>
import { onMounted, ref } from "vue";
import RestaurantsHeader from "@/components/RestaurantsHeader.vue";
import {
  Plus,
  Trash2,
  MapPin,
  Banknote,
  Edit2,
  Check,
  X,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api/axios";
import { toast } from "vue-sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth";

interface DeliveryArea {
  city: string;
  deliveryCost: number;
}

const deliveryAreas = ref<DeliveryArea[]>([]);
const auth = useAuthStore();
const newCity = ref("");
const cities = ref<{ city_id: number; city_name: string }[]>([]);
const newCost = ref<number | "">("");

const editingIndex = ref<number | null>(null);
const editValue = ref<number | "">("");

async function fetchCities() {
  try {
    const [citiesRes, restaurantRes] = await Promise.all([
      api.get(`/cities`),
      api.get(`/restaurants/${auth.user.restaurant_id}/cities`),
    ]);

    cities.value = citiesRes.data;
    deliveryAreas.value = restaurantRes.data.restaurant?.delivery_areas || [];
  } catch (err) {
    toast.error("فشل تحميل البيانات");
  }
}

function addArea() {
  if (newCity.value && newCost.value !== "") {
    if (deliveryAreas.value.some((a) => a.city === newCity.value)) {
      toast.error("هذه المدينة مضافة بالفعل");
      return;
    }

    deliveryAreas.value.push({
      city: newCity.value,
      deliveryCost: Number(newCost.value),
    });
    newCity.value = "";
    newCost.value = "";
  } else {
    toast.error("يرجى اختيار مدينة وتحديد التكلفة");
  }
}

function startEdit(index: number, currentCost: number) {
  editingIndex.value = index;
  editValue.value = currentCost;
}

async function saveEdit(index: number) {
  const area = deliveryAreas.value[index];
  try {
    if (area) {
      await api.put(`/restaurants/${auth.user.restaurant_id}/cities`, {
        cityName: area.city,
        newCost: Number(editValue.value),
      });

      if (deliveryAreas.value[index]) {
        deliveryAreas.value[index].deliveryCost = Number(editValue.value);
        editingIndex.value = null;
      }
      toast.success("تم تحديث السعر");
      return;
    }
    toast.error("فشل التحديث");
  } catch (err) {
    toast.error("فشل التحديث");
  }
}

async function removeArea(index: number) {
  const cityName = deliveryAreas.value[index]?.city;
  try {
    if (cityName) {
      await api.delete(`/restaurants/${auth.user.restaurant_id}/cities`, {
        data: { cityName },
      });
      deliveryAreas.value.splice(index, 1);
      toast.success("تم الحذف بنجاح");
      return;
    }

    toast.error("حدث خطأ أثناء الحذف");
  } catch (err) {
    toast.error("حدث خطأ أثناء الحذف");
  }
}

async function saveSettings() {
  try {
    await api.post(`/restaurants/${auth.user.restaurant_id}/cities`, {
      cities: deliveryAreas.value,
    });
    toast.success("تم حفظ جميع التغييرات");
  } catch (err) {
    toast.error("فشل حفظ التغييرات");
  }
}

onMounted(fetchCities);
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-slate-50 pb-10">
    <RestaurantsHeader />

    <main class="max-w-2xl mx-auto p-4 space-y-6">
      <div class="mt-4">
        <h1 class="text-2xl font-bold text-slate-800">إعدادات مناطق التوصيل</h1>
        <p class="text-slate-500 text-sm">إدارة المدن وتكلفة التوصيل لمتجرك</p>
      </div>

      <Card class="border-none shadow-md">
        <CardContent class="p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">المدينة</label>
              <div class="relative">
                <MapPin
                  class="absolute right-3 top-3 h-4 w-4 text-slate-400 z-10"
                />
                <Select v-model="newCity">
                  <SelectTrigger
                    class="w-full pr-10 h-12 rounded-xl border-slate-200"
                  >
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
              <label class="text-sm font-bold text-slate-700"
                >تكلفة التوصيل (ج.م)</label
              >
              <div class="relative">
                <Banknote
                  class="absolute right-3 top-3 h-4 w-4 text-slate-400"
                />
                <Input
                  v-model="newCost"
                  type="number"
                  placeholder="0.00"
                  class="pr-10 h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          <Button
            @click="addArea"
            class="w-full mt-6 h-12 rounded-xl bg-primary font-bold gap-2"
          >
            <Plus class="h-5 w-5" /> إضافة المنطقة
          </Button>
        </CardContent>
      </Card>

      <div class="space-y-3">
        <h3 class="font-bold text-slate-700 px-1">
          المناطق المضافة ({{ deliveryAreas.length }})
        </h3>

        <div
          v-if="deliveryAreas.length === 0"
          class="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400"
        >
          لم يتم إضافة أي مناطق بعد
        </div>

        <TransitionGroup name="list">
          <div
            v-for="(area, index) in deliveryAreas"
            :key="area.city"
            class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
          >
            <div class="flex flex-col flex-1">
              <span class="font-bold text-slate-800">{{ area.city }}</span>

              <div
                v-if="editingIndex === index"
                class="flex items-center gap-2 mt-1"
              >
                <Input
                  v-model="editValue"
                  type="number"
                  class="h-8 w-24 text-xs"
                />
                <Button
                  size="icon"
                  class="h-8 w-8 bg-green-500 hover:bg-green-600"
                  @click="saveEdit(index)"
                >
                  <Check class="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-8 w-8 text-slate-400"
                  @click="editingIndex = null"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>

              <span v-else class="text-sm text-primary font-medium"
                >{{ area.deliveryCost }} ج.م</span
              >
            </div>

            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                @click="startEdit(index, area.deliveryCost)"
                class="text-slate-400 hover:text-blue-600"
              >
                <Edit2 class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                @click="removeArea(index)"
                class="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div class="pt-4" v-if="deliveryAreas.length > 0">
        <Button
          @click="saveSettings"
          class="w-full h-14 rounded-2xl text-lg font-extrabold shadow-lg shadow-primary/20"
        >
          حفظ الكل
        </Button>
      </div>
    </main>
  </div>
</template>
