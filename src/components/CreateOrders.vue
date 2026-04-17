<script setup lang="ts">
import { Input } from "@/components/ui/input";
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
import api from "@/api/axios";
import { toast } from "vue-sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const isCreateOrderOpen = ref(false);
const receiptImage = ref<File | null>(null);
const receiptPreview = ref<string | null>(null);
const loading = ref(false);
const newOrder = ref({
  customerPhone: "+2",
  totalAmount: 0,
  order_city: "",
  payment_method: "",
});
const deliveryAreas = ref<any>([]);

const showDropdown = ref(false);
const phoneInputRef = ref<HTMLElement | null>(null);

const handleReceiptUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    receiptImage.value = file;
    receiptPreview.value = URL.createObjectURL(file);
  }
};

async function fetchCities() {
  if (!auth.user?.restaurant_id) return;
  try {
    const restaurantRes = await api.get(
      `/restaurants/${auth.user.restaurant_id}/cities`,
    );

    deliveryAreas.value = restaurantRes.data.restaurant?.delivery_areas || [];
  } catch (err: any) {
    toast.error("فشل تحميل المدن");
  }
}

const handleCreateOrder = async () => {
  loading.value = true;

  const formData = new FormData();
  // Safe filtering: gracefully handle area finding to avoid TypeError
  const selectedArea = deliveryAreas.value.find(
    (area: any) => area.city === newOrder.value.order_city,
  );
  const getDeliveryCost = selectedArea ? selectedArea.deliveryCost : 0;

  formData.append("customerPhone", newOrder.value.customerPhone);
  formData.append("totalAmount", newOrder.value.totalAmount.toString());
  formData.append("order_city", newOrder.value.order_city);
  formData.append("deliveryCost", getDeliveryCost);
  formData.append("paymentMethod", newOrder.value.payment_method.toString());
  if (receiptImage.value) {
    formData.append("receiptImage", receiptImage.value);
  }

  try {
    await api.post("/orders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("تم إنشاء الطلب بنجاح");

    newOrder.value = {
      customerPhone: "+2",
      totalAmount: 0,
      order_city: "",
      payment_method: "",
    };
    receiptImage.value = null;
    receiptPreview.value = null;
    isCreateOrderOpen.value = false;
  } catch (err: any) {
    toast.error(err.message || "فشل في إنشاء الطلب");
  } finally {
    loading.value = false;
  }
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

        <div
          class="grid gap-4"
          :class="
            newOrder.payment_method === 'cash' ? 'grid-cols-2' : 'grid-cols-1'
          "
        >
          <div class="space-y-2" v-if="newOrder.payment_method === 'cash'">
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
                    v-for="city in deliveryAreas"
                    :key="city.city"
                    :value="city.city"
                  >
                    {{ city.city }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="space-y-2">
          <Label>طريقة الدفع</Label>
          <Select v-model="newOrder.payment_method" required>
            <SelectTrigger class="w-full">
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel class="text-gray-400">
                  الخيارات المتاحة
                </SelectLabel>

                <SelectItem value="cash">الدفع عند الاستلام</SelectItem>

                <SelectItem value="ewallet"
                  >المحافظ الإلكترونية (فودافون كاش، إلخ)</SelectItem
                >

                <SelectItem value="card">بطاقة ائتمان / ميزة</SelectItem>

                <SelectItem value="instapay">إنستا باي (Instapay)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isCreateOrderOpen = false"
          >إلغاء</Button
        >
        <Button
          class="bg-primary hover:bg-primary/90"
          @click="handleCreateOrder"
          :disabled="!newOrder.order_city || loading"
        >
          <Loader v-if="loading" class="animate-spin" />
          <span v-else>إنشاء الطلب</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
