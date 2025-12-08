<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Plus } from "lucide-vue-next";
import { onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { httpRequest } from "@/utils/http";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import api from "@/api/axios";

const isCreateOrderOpen = ref(false);
const receiptImage = ref<File | null>(null);
const receiptPreview = ref<string | null>(null);
const loading = ref(false);
const newOrder = ref({
  customerPhone: "",
  totalAmount: 0,
  deliveryCost: 0,
  order_city: "",
});

const showDropdown = ref(false);
const phoneInputRef = ref<HTMLElement | null>(null);
const cities = ref<any>([]);

async function fetchCities() {
  try {
    const resp = await api.get("/cities");
    cities.value = resp.data;
  } catch (err: any) {
    console.error("fetchCities error:", err);
    toast.error("فشل تحميل المدن");
  }
}
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const handleReceiptUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    receiptImage.value = file;
    receiptPreview.value = URL.createObjectURL(file);
  }
};

const handleCreateOrder = async () => {
  loading.value = true;

  let base64Image: string | null = null;
  if (receiptImage.value) {
    base64Image = await fileToBase64(receiptImage.value);
  }

  const payload = {
    customerPhone: newOrder.value.customerPhone,
    totalAmount: newOrder.value.totalAmount,
    deliveryCost: newOrder.value.deliveryCost,
    receiptImage: base64Image,
    order_city: newOrder.value.order_city,
  };

  try {
    await httpRequest({
      url: "/api/orders",
      method: "POST",
      data: payload,
    });
    toast.success("تم إنشاء الطلب بنجاح");

    newOrder.value = {
      customerPhone: "",
      totalAmount: 0,
      deliveryCost: 0,
      order_city: "",
    };
    receiptImage.value = null;
    receiptPreview.value = null;
  } catch (err: any) {
    toast.error(err.message || "فشل في إنشاء الطلب");
  } finally {
    loading.value = false;
  }

  isCreateOrderOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (phoneInputRef.value && !phoneInputRef.value.contains(target)) {
    showDropdown.value = false;
  }
};

onMounted(async () => {
  await fetchCities();
});

watch(isCreateOrderOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});
</script>

<template>
  <Dialog v-model:open="isCreateOrderOpen">
    <DialogTrigger as-child>
      <Button class="bg-primary hover:bg-primary/90">
        <Plus class="h-4 w-4 mr-2" />
        إنشاء طلب
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>إضافة طلب جديد</DialogTitle>
        <DialogDescription>ضيف طلب جديد لتوصيل أو استلام</DialogDescription>
      </DialogHeader>

      <div dir="rtl" class="grid gap-4 py-4 relative">
        <div class="space-y-2">
          <Label for="receiptImage">صورة الفاتورة (اختياري)</Label>
          <Input
            id="receiptImage"
            type="file"
            accept="image/*"
            @change="handleReceiptUpload"
          />
          <div v-if="receiptPreview" class="mt-3">
            <p class="text-sm text-muted-foreground mb-2">معاينة الصورة:</p>
            <img
              :src="receiptPreview"
              alt="Receipt Preview"
              class="rounded-md border w-full h-48 object-cover"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="totalAmount">إجمالي السعر (ج.م)</Label>
            <Input
              id="totalAmount"
              type="number"
              v-model="newOrder.totalAmount"
              placeholder="0.00"
            />
          </div>
          <div class="space-y-2">
            <Label>المدينة</Label>
            <Select v-model="newOrder.order_city" required>
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
        </div>
        <div class="flex flex-col space-y-2">
          <Label for="customerPhone">رقم هاتف العميل</Label>
          <Input
            v-model="newOrder.customerPhone"
            id="customerPhone"
            type="tel"
            placeholder="01212158465"
          />
        </div>

        <div class="flex flex-col space-y-2">
          <Label for="deliveryCost">تكلفة التوصيل</Label>
          <Input
            v-model="newOrder.deliveryCost"
            id="deliveryCost"
            type="number"
            placeholder="0.00"
          />
        </div>

        <div class="flex space-x-2">
          <Button @click="newOrder.deliveryCost += 5">+5 ج.م</Button>
          <Button @click="newOrder.deliveryCost += 10">+10 ج.م</Button>
          <Button @click="newOrder.deliveryCost += 15">+15 ج.م</Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isCreateOrderOpen = false"
          >إلغاء</Button
        >
        <Button
          class="bg-primary hover:bg-primary/90"
          @click="handleCreateOrder"
          :disabled="!newOrder.totalAmount || !newOrder.deliveryCost || loading"
        >
          <Loader v-if="loading" class="animate-spin" />
          <span v-else>إنشاء الطلب</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
