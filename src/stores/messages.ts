import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api/axios";

export interface Message {
  message_id: number;
  driver_id: number | null;
  title: string;
  content: string;
  created_at: string;
}

export const useMessagesStore = defineStore("messages", () => {
  const messages = ref<Message[]>([]);
  const loading = ref(false);

  async function fetchMessages() {
    loading.value = true;
    try {
      const res = await api.get("/driver/messages/all");
      messages.value = res.data.messages || [];
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      loading.value = false;
    }
  }

  function addMessage(msg: Message) {
    if (!messages.value.find((m) => m.message_id === msg.message_id)) {
      messages.value.unshift(msg);
    }
  }

  return {
    messages,
    loading,
    fetchMessages,
    addMessage,
  };
});
