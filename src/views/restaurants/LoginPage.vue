<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Loader } from "lucide-vue-next";
import { toast } from "vue-sonner";

const name = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.init();
  if (auth.isAuthenticated) {
    router.push("/restaurant/dashboard");
  }
});

async function handleLogin() {
  loading.value = true;

  try {
    await auth.restaurantlogin(name.value, password.value);
    router.push("/restaurant/dashboard");
  } catch (err: any) {
    toast.error("فشل في تسجيل الدخول");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main
    dir="rtl"
    class="flex min-h-screen items-center justify-center bg-muted p-4"
  >
    <Card class="w-86">
      <CardHeader>
        <CardTitle class="text-2xl"> تسجيل الدخول </CardTitle>
        <CardDescription>
          أدخل اسم المطعمك أدناه لتسجيل الدخول إلى حسابك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="handleLogin">
          <div class="grid gap-2">
            <Label for="name">اسم المطعم</Label>
            <Input
              id="name"
              type="text"
              placeholder="اسم المطعم"
              v-model="name"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">كلمة المرور</Label>
            </div>
            <Input id="password" type="password" v-model="password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            <Loader v-if="loading" class="animate-spin" />
            <span v-else>تسجيل الدخول</span>
          </Button>
          <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
