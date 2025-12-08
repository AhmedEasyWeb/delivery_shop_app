<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { PanelLeft, XCircle, XCircleIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  close?: boolean;
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <XCircle v-if="close" />
    <PanelLeft v-if="!close" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
