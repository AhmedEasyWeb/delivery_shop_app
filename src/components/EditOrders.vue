<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Order } from "@/types";
import api from "@/api/axios";
import { toast } from "vue-sonner";

interface Props {
  open: boolean;
  order: Order | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "update"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const formData = ref({
  order_total_price: 0,
  order_delivery_cost: 0,
  notes: "",
  restaurant_id: 0,
});

const canEditPrice = computed(() => {
  if (!props.order?.created_at) return false;
  // Handle both ISO strings and standard SQLite 2024-01-01 12:00:00 format
  const createdAtStr = props.order.created_at.includes("T")
    ? props.order.created_at
    : props.order.created_at.replace(" ", "T");
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
  return diffInMinutes >= 5;
});

watch(
  () => props.order,
  (newOrder) => {
    if (newOrder) {
      formData.value = {
        order_total_price: newOrder.order_total_price || 0,
        order_delivery_cost: newOrder.order_delivery_cost || 0,
        notes: newOrder.order_notes || "",
        restaurant_id: newOrder.restaurant_id,
      };
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emit("update:open", false);
};

const handleSubmit = async () => {
  if (!props.order) return;

  loading.value = true;

  try {
    await api.put(`/orders/${props.order.order_id}`, formData.value);

    toast.success("تم تحديث الطلب بنجاح!");
    emit("update");
    handleClose();
  } catch (err: any) {
    toast.error(err.response?.data?.message || "فشل تحديث الطلب");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[600px]" dir="rtl">
      <DialogHeader>
        <DialogTitle>تعديل الطلب #{{ order?.order_id }}</DialogTitle>
        <DialogDescription>
          قم بتعديل بيانات الطلب وحفظ التغييرات
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label
            for="order_total_price"
            :class="{ 'opacity-50': !canEditPrice }"
          >
            إجمالي السعر (ج.م)
            <span
              v-if="!canEditPrice"
              class="text-xs text-orange-500 font-normal"
            >
              (متاح التعديل بعد 5 دقائق من إنشاء الطلب)
            </span>
          </Label>
          <Input
            id="order_total_price"
            v-model.number="formData.order_total_price"
            type="number"
            step="0.01"
            placeholder="0.00"
            :disabled="!canEditPrice"
          />
        </div>

        <div class="grid gap-2">
          <Label for="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            placeholder="أضف ملاحظات إضافية (اختياري)"
            rows="3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="loading">
          إلغاء
        </Button>
        <Button @click="handleSubmit" :disabled="loading">
          {{ loading ? "جاري الحفظ..." : "حفظ التغييرات" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
