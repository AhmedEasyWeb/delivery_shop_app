<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContactInfo from "./ContactInfo.vue";
import api from "@/api/axios";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit("update:open", val),
});

const branchName = ref("");
const driverSupportPhone = ref("");
const loading = ref(false);

const fetchSupportNumbers = async () => {
  loading.value = true;
  try {
    const res = await api.get("/driver/support-numbers/contact");
    branchName.value = res.data.branch_name || "";
    driverSupportPhone.value = res.data.driver_support_phone || "";
  } catch (error) {
    console.error("Failed to fetch support numbers", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      fetchSupportNumbers();
    }
  },
);
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md rounded-3xl bg-white p-6" dir="rtl">
      <DialogHeader class="text-right">
        <DialogTitle class="font-black text-xl text-slate-900 mb-2">
          التواصل مع الدعم الفني
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-6 my-4">
        <p
          class="text-sm font-medium text-slate-500 leading-relaxed text-right"
        >
          دعم فرع {{ branchName }}
        </p>

        <div v-if="loading" class="text-center text-slate-500 py-4">
          جاري تحميل رقم الدعم...
        </div>

        <!-- Contact Info display -->
        <div
          v-else-if="driverSupportPhone"
          class="animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ContactInfo
            :phone="driverSupportPhone"
            :branch-name="branchName"
            type="support"
          />
        </div>
        
        <div v-else class="text-center text-slate-500 py-4">
          لا يوجد رقم دعم متاح لفرعك
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
