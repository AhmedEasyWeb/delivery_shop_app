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
import { Loader, ArrowLeft, ArrowRight } from "lucide-vue-next";

const name = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.checkRestaurantSession();
  await auth.checkSession();
  if (auth.isAuthenticated) {
    if (auth.type === "driver") {
      router.push("/driver-panel");
    } else if (auth.type === "restaurant") {
      router.push("/restaurant/dashboard");
    }
  }
});

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    const status = await auth.restaurantlogin(name.value, password.value);
    if (status) {
      router.push("/restaurant/dashboard");
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4"
  >
    <router-link
      to="/landing"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 left-4 hover:underline"
    >
      <ArrowLeft class="w-4 h-4 md:w-6 md:h-6" />
      <p>الصفحة الرئيسية</p>
    </router-link>
    <router-link
      to="/"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 right-4 hover:underline"
    >
      <p>الطيار</p>
      <ArrowRight class="w-4 h-4 md:w-6 md:h-6" />
    </router-link>
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl text-center">
          تسجيل الدخول المطاعم
        </CardTitle>
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
  </div>
</template>
