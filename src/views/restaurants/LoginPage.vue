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
import { Loader, Phone, Lock } from "lucide-vue-next";
import { toast } from "vue-sonner";

const phone = ref("");
const password = ref("");
const loading = ref(false);

const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await auth.init();
  if (auth.isAuthenticated) {
    router.push("/restaurant/dashboard");
  }
});

async function handleLogin() {
  if (!phone.value || !password.value) {
    toast.error("من فضلك أدخل جميع البيانات");
    return;
  }

  loading.value = true;

  try {
    await auth.restaurantlogin(phone.value, password.value);
    toast.success("تم تسجيل الدخول بنجاح");
    router.push("/restaurant/dashboard");
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message || "رقم الهاتف أو كلمة المرور غير صحيحة";
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main
    dir="rtl"
    class="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans"
  >
    <Card class="w-full max-w-md shadow-lg border-t-4 border-t-primary">
      <CardHeader class="text-center space-y-1">
        <CardTitle class="text-2xl font-bold"> تسجيل دخول المطعم </CardTitle>
        <CardDescription>
          أدخل بيانات حسابك للمتابعة إلى لوحة التحكم
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form class="grid gap-5" @submit.prevent="handleLogin">
          <!-- Phone -->
          <div class="grid gap-2">
            <Label for="phone">رقم الهاتف</Label>
            <div class="relative">
              <Phone
                class="absolute right-3 top-3 w-4 h-4 text-muted-foreground"
              />
              <Input
                id="phone"
                type="text"
                placeholder="05xxxxxxxx"
                v-model="phone"
                class="pr-9"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <Label for="password">كلمة المرور</Label>
              <Button
                variant="link"
                class="px-0 font-normal text-xs h-auto"
                type="button"
              >
                نسيت كلمة المرور؟
              </Button>
            </div>

            <div class="relative">
              <Lock
                class="absolute right-3 top-3 w-4 h-4 text-muted-foreground"
              />
              <Input
                id="password"
                type="password"
                v-model="password"
                class="pr-9"
                placeholder="********"
                required
              />
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="w-full h-11 text-lg font-semibold"
            :disabled="loading"
          >
            <Loader v-if="loading" class="animate-spin ml-2" />
            <span v-else>دخول</span>
          </Button>

          <!-- Register -->
          <div class="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟
            <Button
              variant="link"
              class="p-0 h-auto font-bold text-primary"
              type="button"
              @click="router.push('/restaurant/register')"
            >
              سجل مطعمك الآن
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
