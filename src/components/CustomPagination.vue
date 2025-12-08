<script setup lang="ts">
import { computed } from "vue";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Emits {
  (e: "update:currentPage", page: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const totalPages = computed(() =>
  Math.ceil(props.totalItems / props.itemsPerPage)
);

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = props.currentPage;

  if (total <= 4) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, current - 1);
    let end = Math.min(total, start + 3);

    if (end - start < 3) {
      start = Math.max(1, end - 3);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

const showFirstEllipsis = computed(() => visiblePages.value[0] ?? 0 > 1);
const showLastEllipsis = computed(
  () =>
    (visiblePages.value[visiblePages.value.length - 1] ?? 0) < totalPages.value
);

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    emit("update:currentPage", page);
  }
}
</script>

<template>
  <div class="flex justify-center mt-6">
    <Pagination
      :total="totalItems"
      :items-per-page="itemsPerPage"
      :sibling-count="1"
      show-edges
      :default-page="currentPage"
      @update:page="goToPage"
    >
      <PaginationContent class="flex items-center gap-1">
        <PaginationNext @click="goToPage(currentPage + 1)" />

        <PaginationItem v-if="showFirstEllipsis" :value="0" :is-active="false">
          <PaginationEllipsis />
        </PaginationItem>

        <PaginationItem
          v-for="pageNum in visiblePages"
          :key="pageNum"
          :value="pageNum"
          :is-active="currentPage === pageNum"
          as-child
        >
          <Button
            class="w-10 h-10 p-0 text-black"
            :variant="currentPage === pageNum ? 'default' : 'outline'"
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </Button>
        </PaginationItem>

        <PaginationItem v-if="showLastEllipsis" :value="0" :is-active="false">
          <PaginationEllipsis />
        </PaginationItem>

        <PaginationPrevious @click="goToPage(currentPage - 1)" />
      </PaginationContent>
    </Pagination>
  </div>
</template>
