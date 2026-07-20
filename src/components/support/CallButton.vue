<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-vue-next";

defineProps<{
  phone: string;
}>();
</script>

<template>
  <a :href="`https://wa.me/${phone.startsWith('0') ? '2' + phone : phone}`" target="_blank" rel="noopener noreferrer" class="w-full block">
    <Button
      class="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95"
    >
      <MessageCircle class="w-5 h-5" />
      <span>واتساب</span>
    </Button>
  </a>
</template>
