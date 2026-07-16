<script setup lang="ts">
import { MapPin, CheckCircle2 } from "lucide-vue-next";

export interface BranchOption {
  id: string;
  name: string;
  description?: string;
}

defineProps<{
  branches: BranchOption[];
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="grid grid-cols-2 gap-3 w-full" dir="rtl">
    <div
      v-for="branch in branches"
      :key="branch.id"
      @click="emit('update:modelValue', branch.id)"
      class="relative p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 select-none hover:scale-[1.02] active:scale-98"
      :class="
        modelValue === branch.id
          ? 'border-red-500 bg-red-50/50 shadow-sm'
          : 'border-slate-100 bg-white hover:border-slate-200'
      "
    >
      <!-- Selection Indicator -->
      <div
        v-if="modelValue === branch.id"
        class="absolute top-2 left-2 text-red-500 animate-in zoom-in duration-200"
      >
        <CheckCircle2 class="w-5 h-5 fill-red-500 text-white" />
      </div>

      <!-- Icon -->
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300"
        :class="modelValue === branch.id ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'"
      >
        <MapPin class="w-6 h-6" />
      </div>

      <!-- Branch Name -->
      <span
        class="font-black text-base"
        :class="modelValue === branch.id ? 'text-red-700' : 'text-slate-700'"
      >
        {{ branch.name }}
      </span>

      <!-- Description -->
      <span
        v-if="branch.description"
        class="text-[11px] mt-1 font-medium leading-tight text-slate-400"
      >
        {{ branch.description }}
      </span>
    </div>
  </div>
</template>
