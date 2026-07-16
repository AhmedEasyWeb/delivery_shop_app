<script setup lang="ts">
import { PhoneCall } from "lucide-vue-next";
import CallButton from "./CallButton.vue";

defineProps<{
  phone: string;
  branchName?: string;
  type?: 'support' | 'payment';
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-xs w-full text-center" dir="rtl">
    <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
      <PhoneCall class="w-5 h-5" />
    </div>

    <h4 class="font-black text-slate-800 text-sm mb-1">
      {{ type === 'payment' ? 'رقم الحسابات والتحصيل' : 'رقم الدعم الفني' }}
      <span v-if="branchName" class="text-red-600">({{ branchName }})</span>
    </h4>

    <p class="text-2xl font-black text-slate-700 tracking-wide mb-6 select-all" dir="ltr">
      {{ phone }}
    </p>

    <CallButton :phone="phone" />
  </div>
</template>
