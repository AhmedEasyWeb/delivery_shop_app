<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useMessagesStore } from "@/stores/messages";
import { Mail, Clock, Eye, RefreshCw } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const messagesStore = useMessagesStore();
const selectedMessage = ref<any>(null);
const isDetailOpen = ref(false);

function viewMessage(msg: any) {
  selectedMessage.value = msg;
  isDetailOpen.value = true;
}

onMounted(() => {
  messagesStore.fetchMessages();
});

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch (e) {
    return dateStr;
  }
}
</script>

<template>
  <div class="space-y-4 px-4 py-2" dir="rtl">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-black text-slate-800">صندوق الوارد (الرسائل)</h3>
      <Button
        variant="ghost"
        size="sm"
        class="text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-100"
        @click="messagesStore.fetchMessages()"
        :disabled="messagesStore.loading"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': messagesStore.loading }" />
        تحديث
      </Button>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div v-if="messagesStore.loading" class="flex justify-center items-center py-16">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>

      <div v-else-if="messagesStore.messages.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <Mail class="w-16 h-16 mb-4 opacity-25" />
        <p class="font-bold text-sm">لا توجد رسائل إدارية حتى الآن</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold">
              <th class="p-4 w-12 text-center">رقم</th>
              <th class="p-4">العنوان</th>
              <th class="p-4 hidden md:table-cell">المحتوى</th>
              <th class="p-4 w-36">التاريخ</th>
              <th class="p-4 w-20 text-center">تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(msg, index) in messagesStore.messages"
              :key="msg.message_id"
              class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
              @click="viewMessage(msg)"
            >
              <td class="p-4 text-center font-bold text-slate-400 text-sm">
                {{ index + 1 }}
              </td>
              <td class="p-4">
                <div class="font-bold text-slate-800 text-sm truncate max-w-[150px] md:max-w-xs">
                  {{ msg.title }}
                </div>
                <div class="text-xs text-slate-400 md:hidden mt-0.5 truncate max-w-[150px]">
                  {{ msg.content }}
                </div>
              </td>
              <td class="p-4 hidden md:table-cell">
                <div class="text-slate-500 text-sm truncate max-w-md">
                  {{ msg.content }}
                </div>
              </td>
              <td class="p-4 text-xs font-medium text-slate-400">
                {{ formatTime(msg.created_at) }}
              </td>
              <td class="p-4 text-center" @click.stop>
                <Button
                  variant="ghost"
                  size="icon"
                  class="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 hover:text-red-600 hover:bg-slate-100"
                  @click="viewMessage(msg)"
                >
                  <Eye class="w-4 h-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Message Detail Modal -->
    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="w-[90%] max-w-md rounded-3xl p-6 border-none shadow-2xl" dir="rtl">
        <DialogHeader class="text-right">
          <DialogTitle class="text-xl font-black text-slate-900 flex items-center gap-2">
            <Mail class="w-6 h-6 text-red-600 shrink-0" />
            <span>{{ selectedMessage?.title }}</span>
          </DialogTitle>
        </DialogHeader>

        <div class="py-4 space-y-4">
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <p class="text-slate-700 font-bold text-sm leading-relaxed whitespace-pre-wrap">
              {{ selectedMessage?.content }}
            </p>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium justify-end">
            <Clock class="w-3.5 h-3.5" />
            <span>{{ selectedMessage ? formatTime(selectedMessage.created_at) : '' }}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            class="w-full h-12 rounded-2xl bg-slate-950 font-black text-white hover:bg-slate-800"
            @click="isDetailOpen = false"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
