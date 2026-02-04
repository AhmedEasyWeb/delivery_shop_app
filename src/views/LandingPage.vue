<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header.vue";
import { useRouter } from "vue-router";
import {
  ShieldCheck,
  CircleDollarSign,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  Download,
  MessageSquare,
  Heart,
} from "lucide-vue-next";
import { httpRequest } from "@/utils/http";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import api from "@/api/axios";

const router = useRouter();

function goToHash(uri: string) {
  const el = document.getElementById(uri);
  el?.scrollIntoView({ behavior: "smooth" });
}

const name = ref("");
const phone = ref("");
const message = ref("");
const currentBransh = ref(0);

const cities = ref<{ city_id: number; city_name: string; branch_id: number }[]>(
  [],
);

const numbers: { [key: number]: string[] } = {
  0: ["01012003846", "01202777049"],
  1: ["01044054458", "01202777049"],
  2: ["01012003846", "01022969694"],
};

async function fetchCities() {
  try {
    const res = await api.get(`/cities`);
    cities.value = res.data;
    console.log(res.data);
  } catch (err) {
    toast.error("فشل تحميل المدن");
  }
}

async function submitContact() {
  const res = await httpRequest<any>({
    url: "/api/contacts",
    method: "POST",
    data: { name: name.value, phone: phone.value, message: message.value },
  });

  if (res.success) {
    toast.success("تم ارسال الرسالة بنجاح");
    name.value = phone.value = message.value = "";
  }
}

onMounted(async () => {
  fetchCities();
});
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 font-sans text-right selection:bg-red-100"
    dir="rtl"
  >
    <Header />

    <section
      id="hero"
      class="relative pt-24 pb-16 px-6 overflow-hidden bg-linear-to-b from-white to-slate-50"
    >
      <div class="max-w-6xl mx-auto flex flex-col items-center text-center">
        <div
          class="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-fade-in"
        >
          <Zap class="w-4 h-4 fill-red-600" />
          أسرع خدمة توصيل في منطقتك
        </div>

        <h1
          class="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.2]"
        >
          التوصيل مش بس سرعة، <br />
          <span class="text-red-600">ثقة والتزام</span>
        </h1>

        <p class="text-lg text-slate-600 mb-10 max-w-2xl leading-relaxed">
          في Delivery Shop إحنا شريك نجاحك. هدفنا نوصل طلبك في الوقت المحدد
          بأمان واحترافية.
        </p>

        <div
          class="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center"
        >
          <Button
            @click="goToHash('contact')"
            class="h-14 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95"
          >
            ابدأ الآن
            <ArrowLeft class="mr-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            @click="goToHash('about')"
            class="h-14 border-2 border-slate-200 text-slate-700 text-xl font-bold rounded-2xl hover:bg-white active:scale-95"
          >
            تعرف علينا
          </Button>
        </div>

        <div class="mt-16 relative w-full max-w-lg">
          <div
            class="absolute inset-0 bg-red-500/10 blur-[100px] rounded-full"
          ></div>
          <img
            src="/landing.png"
            alt="App Interface"
            class="relative z-10 w-full h-auto drop-shadow-2xl animate-float"
          />
        </div>
      </div>
    </section>

    <section id="about" class="py-12 px-6">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="(stat, i) in [
            {
              icon: Zap,
              val: '10,000+',
              label: 'عملية توصيل',
              color: 'text-amber-500',
              bg: 'bg-amber-50',
            },
            {
              icon: ShieldCheck,
              val: '500+',
              label: 'عميل سعيد',
              color: 'text-blue-500',
              bg: 'bg-blue-50',
            },
            {
              icon: CircleDollarSign,
              val: '99.8%',
              label: 'نسبة الدقة',
              color: 'text-emerald-500',
              bg: 'bg-emerald-50',
            },
          ]"
          :key="i"
          class="bg-white p-6 rounded-xl border border-slate-100 flex items-center gap-6 shadow-sm"
        >
          <div :class="[stat.bg, 'p-4 rounded-2xl']">
            <component :is="stat.icon" :class="['w-8 h-8', stat.color]" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-slate-900">{{ stat.val }}</h3>
            <p class="text-slate-500 font-medium">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <section
      id="service"
      class="py-20 px-6 bg-slate-900 text-white rounded-[3rem] mx-4 my-8"
    >
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-black mb-4">خدماتنا الذكية</h2>
          <div class="h-1.5 w-20 bg-red-600 mx-auto rounded-full"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            v-for="(service, i) in [
              {
                title: 'سائقين 24/7',
                desc: 'فريق محترف متاح في أي وقت لتلبية احتياجاتك.',
                icon: Clock,
                color: 'bg-red-500',
              },
              {
                title: 'المتاجر الإلكترونية',
                desc: 'نوصل منتجات متجرك الأونلاين لعملائك بسرعة.',
                icon: Download,
                color: 'bg-blue-500',
              },
              {
                title: 'المطاعم والكافيهات',
                desc: 'خدمة سريعة وآمنة لإدارة طلبات الطعام والمشروبات.',
                icon: MessageSquare,
                color: 'bg-emerald-500',
              },
            ]"
            :key="i"
            class="bg-slate-800 border-none rounded-xl p-4 text-white"
          >
            <CardHeader>
              <div
                :class="[
                  service.color,
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg',
                ]"
              >
                <component :is="service.icon" class="w-7 h-7 text-white" />
              </div>
              <CardTitle class="text-2xl font-bold">{{
                service.title
              }}</CardTitle>
            </CardHeader>
            <CardContent class="text-slate-400 leading-relaxed">
              {{ service.desc }}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section
      id="why_us"
      class="relative py-24 px-6 overflow-hidden bg-slate-50"
    >
      <div
        class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50"
      ></div>

      <div class="max-w-6xl mx-auto relative z-10">
        <div class="text-center mb-16">
          <h2
            class="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
          >
            ليه تختار <span class="text-red-600">دليفري شوب؟</span>
          </h2>
          <p
            class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            إحنا مش مجرد شركة توصيل، إحنا شريكك التقني واللوجستي. هدفنا نخدم
            عملائك بالاهتمام، السرعة والثقة.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            class="group hover:shadow-2xl hover:shadow-red-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <Clock class="h-8 w-8 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >الالتزام في المواعيد</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                بنسبة وصول <span class="text-red-600 font-bold">98%</span>،
                بنحترم وقتك ونتأكد إن الطلب يوصل في الوقت المتفق عليه بالظبط.
              </p>
            </CardContent>
          </Card>

          <Card
            class="group hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <ShieldCheck class="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >أمان بنسبة 100%</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                تتبع لحظي، وتأكيد استلام رقمي لكل طلب. متطمن إن شحنتك في إيد
                أمينة ومؤمن عليها.
              </p>
            </CardContent>
          </Card>

          <Card
            class="group hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <MapPin class="h-8 w-8 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >خبرة محلية</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                نعرف كل شارع وزقاق في منطقتك. خبرتنا بتساعدنا نختار أسرع الطرق
                بعيداً عن الزحام.
              </p>
            </CardContent>
          </Card>

          <Card
            class="group hover:shadow-2xl hover:shadow-amber-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <Phone class="h-8 w-8 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >دعم فني 24/7</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                فريق دعم بشري (مش بوتات) جاهز يساعدك في أي وقت عن طريق الاتصال
                المباشر أو واتساب.
              </p>
            </CardContent>
          </Card>

          <Card
            class="group hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <Zap class="h-8 w-8 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >سرعة التنفيذ</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                أكتر من
                <span class="font-bold text-purple-600">10,000</span> عملية
                ناجحة. نظامنا التقني يوزع الطلبات بذكاء لأقرب سائق.
              </p>
            </CardContent>
          </Card>

          <Card
            class="group hover:shadow-2xl hover:shadow-pink-100 transition-all duration-300 border-none rounded-[2.5rem] bg-white p-4"
          >
            <CardHeader class="pb-2">
              <div
                class="bg-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <Heart class="h-8 w-8 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle class="text-2xl font-black text-slate-800 mb-3"
                >لمسة إنسانية</CardTitle
              >
              <p class="text-slate-500 leading-relaxed font-medium">
                سائقينا هم واجهتنا. تعامل راقي، هندام نظيف، وابتسامة دايماً مع
                كل عميل يوصل له الطلب.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section id="contact" class="py-20 px-6">
      <div
        class="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100"
      >
        <div class="grid md:grid-cols-2 gap-12">
          <div>
            <h2 class="text-3xl font-black text-slate-900 mb-6">تواصل معنا</h2>
            <p class="text-slate-600 mb-8">
              هل لديك استفسار؟ فريقنا جاهز للرد عليك في أسرع وقت ممكن.
            </p>
            <p class="text-slate-600 mb-8">اختر أقرب مدينة إليك للتواصل معنا</p>

            <div class="space-y-6">
              <select
                v-model="currentBransh"
                required
                class="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-sm appearance-none outline-none focus:ring-2 ring-red-500/20"
              >
                <option disabled :value="0">اختر مدينة</option>
                <option
                  v-for="city in cities"
                  :key="city.city_id"
                  :value="city.branch_id"
                >
                  {{ city.city_name }}
                </option>
              </select>

              <a
                v-for="number in numbers[currentBransh]"
                class="flex items-center gap-4"
                :href="`tel:${number}`"
              >
                <div class="bg-slate-100 p-3 rounded-xl">
                  <Phone class="w-5 h-5 text-primary" />
                </div>
                <span class="font-bold text-slate-700" dir="ltr">
                  {{ number }}
                </span>
              </a>
              <div class="flex items-center gap-4">
                <div class="bg-slate-100 p-3 rounded-xl">
                  <Mail class="w-5 h-5 text-primary" />
                </div>
                <span class="font-bold text-slate-700"
                  >support@deliveryshop.cloud</span
                >
              </div>
            </div>
          </div>

          <form @submit.prevent="submitContact" class="space-y-4">
            <div class="space-y-2">
              <Label class="mr-2 font-bold text-slate-700">الاسم الكريم</Label>
              <Input
                v-model="name"
                placeholder="أدخل اسمك"
                class="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-red-500"
              />
            </div>
            <div class="space-y-2">
              <Label class="mr-2 font-bold text-slate-700">رقم الهاتف</Label>
              <Input
                v-model="phone"
                placeholder="07xx xxx xxxx"
                class="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-red-500"
              />
            </div>
            <div class="space-y-2">
              <Label class="mr-2 font-bold text-slate-700">رسالتك</Label>
              <textarea
                v-model="message"
                rows="4"
                class="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="كيف يمكننا مساعدتك؟"
              ></textarea>
            </div>
            <Button
              type="submit"
              class="w-full h-14 bg-primary hover:bg-slate-800 text-white font-bold rounded-xl text-lg"
            >
              إرسال الرسالة
            </Button>
          </form>
        </div>
      </div>
    </section>

    <footer
      class="bg-white border-t border-slate-100 py-10 px-6 text-center text-slate-500 font-medium"
    >
      <img
        src="/logo.webp"
        alt="Logo"
        class="h-10 mx-auto mb-4 opacity-50 grayscale"
      />
      <p>&copy; 2026 Delivery Shop. جميع الحقوق محفوظة.</p>
    </footer>
  </div>
</template>

<style scoped>
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
