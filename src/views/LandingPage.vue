<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header.vue";

import { useRouter } from "vue-router";
import "@splinetool/viewer";
import {
  ShieldCheck,
  CircleDollarSign,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
} from "lucide-vue-next";
import { httpRequest } from "@/utils/http";
import { ref } from "vue";
import { toast } from "vue-sonner";

const router = useRouter();

function goToHash(uri: string) {
  window.location.hash = `#${uri}`;
}

const name = ref("");
const phone = ref("");
const message = ref("");

async function submitContact() {
  const res = await httpRequest<any>({
    url: "/api/contacts",
    method: "POST",
    data: {
      name: name.value,
      phone: phone.value,
      message: message.value,
    },
  });

  if (res.success) {
    toast.success("تم ارسال الرسالة بنجاح");
    name.value = "";
    phone.value = "";
    message.value = "";
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-right" dir="rtl">
    <Header />
    <section id="hero" class="relative bg-white py-16 px-4 overflow-hidden">
      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between"
      >
        <div class="md:w-1/2 text-center md:text-right mb-8 md:mb-0">
          <h1 class="text-5xl font-extrabold text-gray-800 mb-4 leading-tight">
            التوصيل مش بس سرعة، <br />التوصيل احترام وثقة والتزام
          </h1>
          <p class="text-lg text-gray-600 mb-8">
            في Delivery Shop إحنا مش مجرد شركة توصيل... إحنا شريك نجاح حقيقي.
            هدفنا نوصل طلبك في الوقت المحدد بأمان واحترافية وابتسامة دايماً.
          </p>
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <Button
              @click="goToHash('contact')"
              class="cursor-pointer bg-red-600 text-white hover:bg-red-700 text-lg px-8 py-4 rounded shadow-lg transition-all duration-300 flex items-center justify-center group"
            >
              اتصل بنا
              <ArrowLeft
                class="w-5 h-5 ml-2 group-hover:-translate-x-3 ease-in-out duration-300"
              />
            </Button>
            <Button
              @click="goToHash('about')"
              class="cursor-pointer bg-transparent border-2 border-gray-800 text-gray-800 hover:bg-gray-100 text-lg px-8 py-4 rounded shadow-lg transition-all duration-300 flex items-center justify-center group"
            >
              اعرف أكتر
              <ArrowLeft
                class="w-5 h-5 ml-2 group-hover:-translate-x-3 ease-in-out duration-300"
              />
            </Button>
          </div>
        </div>

        <div class="relative md:w-1/2 flex justify-center">
          <img
            src="/landing.png"
            alt="Delivery Shop Hero Image"
            class="max-w-full h-auto"
          />
        </div>
      </div>
    </section>

    <section id="about" class="bg-gray-100 py-16 px-4">
      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between"
      >
        <div class="md:w-1/2 flex justify-center mb-8 md:mb-0">
          <div
            class="relative bg-white rounded-xl shadow-lg p-8 max-w-sm w-full"
          >
            <img
              src="/logo.webp"
              alt="Delivery Shop Logo"
              class="h-16 mb-4 mx-auto"
            />
            <p class="text-gray-700 text-center mb-6">
              "كل طلب بنوصله كأنه بتاعنا. لأن ثقتك عندنا أغلى حاجة."
            </p>
            <div class="text-center text-sm text-gray-500">
              — فريق Delivery Shop
            </div>
          </div>
        </div>
        <div class="md:w-1/2 text-center md:text-right">
          <h2 class="text-4xl font-extrabold text-gray-800 mb-4 leading-tight">
            شريكك المحلي الموثوق <br />في خدمات التوصيل
          </h2>
          <p class="text-lg text-gray-600 mb-6">
            في Delivery Shop نؤمن أن التوصيل مش مجرد نقل طلب من مكان لمكان، بل
            تجربة مبنية على الثقة، السرعة والاحترام بينا وبين عملائنا.
          </p>
          <p class="text-lg text-gray-600 mb-6">
            بدأنا رحلتنا في عام 2020 بهدف بسيط وواضح: تقديم خدمة توصيل احترافية
            وسريعة تربح وتخليك تركز على شغلك. إحنا أكتر من مجرد شركة توصيل؛ إحنا
            شريك نجاح حقيقي يساعدك تنمو وتوصل عملائك بأفضل شكل ممكن.
          </p>
          <p class="text-lg text-gray-600 mb-8">
            فريقنا من السائقين المحترفين بيعرف الشوارع كويس، وده اللي بيخلينا
            نوصل طلباتك في وقتها، بأمان، وابتسامة دايماً. هدفنا نحافظ على ثقتك
            ونكون دايماً عند حسن ظنك.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div class="flex flex-col items-center">
              <div class="bg-red-100 p-3 rounded-full mb-2">
                <Zap class="h-6 w-6 text-red-600" />
              </div>
              <p class="text-2xl font-bold text-gray-800">10,000 +</p>
              <p class="text-gray-600">عملية توصيل</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="bg-blue-100 p-3 rounded-full mb-2">
                <ShieldCheck class="h-6 w-6 text-blue-600" />
              </div>
              <p class="text-2xl font-bold text-gray-800">500 +</p>
              <p class="text-gray-600">عميل سعيد</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="bg-green-100 p-3 rounded-full mb-2">
                <CircleDollarSign class="h-6 w-6 text-green-600" />
              </div>
              <p class="text-2xl font-bold text-gray-800">99.8 %</p>
              <p class="text-gray-600">نسبة دقة</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="service" class="py-16 px-4">
      <div class="max-w-6xl mx-auto text-center">
        <h2 class="text-4xl font-extrabold text-gray-800 mb-4">خدماتنا</h2>
        <p class="text-lg text-gray-600 mb-12">
          نقدم حلول توصيل ذكية وسريعة تناسب كل أنواع المشاريع مع التزام كامل
          بالجودة والدقة في كل طلب.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-red-100 p-4 rounded-full mx-auto">
                <Clock class="h-8 w-8 text-red-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2">
              سائقين جاهزين 24/7
            </CardTitle>
            <CardContent>
              <p class="text-gray-600">
                فريق محترف متاح في أي وقت لتلبية احتياجاتك.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-blue-100 p-4 rounded-full mx-auto">
                <Zap class="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2">
              توصيل المتاجر الإلكترونية
            </CardTitle>
            <CardContent>
              <p class="text-gray-600">
                نوصل منتجات متجرك الأونلاين لعملائك في الوقت المحدد.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-green-100 p-4 rounded-full mx-auto">
                <CircleDollarSign class="h-8 w-8 text-green-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2">
              توصيل للمطاعم والكافيهات
            </CardTitle>
            <CardContent>
              <p class="text-gray-600">
                خدمة سريعة وآمنة لإدارة طلبات الطعام والمشروبات.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section id="why_us" class="bg-gray-100 py-16 px-4">
      <div class="max-w-6xl mx-auto text-center">
        <h2 class="text-4xl font-extrabold text-gray-800 mb-4">
          ليه تختار دليفري شوب؟
        </h2>
        <p class="text-lg text-gray-600 mb-12">
          إحنا مش مجرد شركة توصيل، إحنا شركاء في نجاحك. هدفنا نخدم مجتمعنا
          بالاهتمام، السرعة والثقة.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-red-100 p-4 rounded-full mx-auto">
                <Clock class="h-8 w-8 text-red-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2"
              >الالتزام في المواعيد</CardTitle
            >
            <CardContent>
              <p class="text-gray-600">
                نسبة التوصيل 98%، بنحترم وقتك ونتأكد إن الطلب يوصل في الوقت
                المتفق عليه بالظبط.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-blue-100 p-4 rounded-full mx-auto">
                <ShieldCheck class="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2"
              >أمان بنسبة 100%</CardTitle
            >
            <CardContent>
              <p class="text-gray-600">
                تغطية تأمينية كاملة، تتبع لحظي، وتأكيد استلام لكل طلب. متطمن إن
                شحنتك في إيد أمينة.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-green-100 p-4 rounded-full mx-auto">
                <MapPin class="h-8 w-8 text-green-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2">خبرة محلية</CardTitle>
            <CardContent>
              <p class="text-gray-600">
                نعرف كل شارع وزقاق في منطقتك. خبرتنا المحلية بتساعدنا نوصل
                طلباتك بسرعة ودقة عالية.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-yellow-100 p-4 rounded-full mx-auto">
                <Phone class="h-8 w-8 text-yellow-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2"
              >دعم فني 24/7</CardTitle
            >
            <CardContent>
              <p class="text-gray-600">
                فريق دعم حقيقي جاهز يساعدك في أي وقت عن طريق الهاتف أو البريد أو
                الشات.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-purple-100 p-4 rounded-full mx-auto">
                <CircleDollarSign class="h-8 w-8 text-purple-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2"
              >تلفة الأتلاف</CardTitle
            >
            <CardContent>
              <p class="text-gray-600">
                أكتر من 10,000 عملية توصيل ناجحة. عملائنا دايماً واثقين فينا
                وإحنا بنشتغل كل يوم عشان نحافظ على الثقة دي.
              </p>
            </CardContent>
          </Card>
          <Card
            class="shadow-lg rounded-xl p-6 flex flex-col items-center text-center"
          >
            <CardHeader class="mb-4 w-full">
              <div class="bg-pink-100 p-4 rounded-full mx-auto">
                <Zap class="h-8 w-8 text-pink-600" />
              </div>
            </CardHeader>
            <CardTitle class="text-xl font-semibold mb-2"
              >لمسة إنسانية</CardTitle
            >
            <CardContent>
              <p class="text-gray-600">
                مش مجرد رقم تتبع، هنعرف السواق اللي بيوصلك بالاسم. وكل طلب
                بنتعامل معاه كأنه خاص بينا.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section id="contact" class="bg-white py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          تواصل معنا
        </h2>
        <p class="text-lg text-gray-600 mb-12 text-center">
          عندك استفسار؟ محتاج حل توصيل خاص؟ فريقنا جاهز يسمعك ويساعدك في أي وقت.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Contact Form -->
          <div>
            <h3 class="text-2xl font-bold text-gray-800 mb-6">أرسل رسالة</h3>
            <form class="space-y-6" @submit.prevent="submitContact">
              <div>
                <Label
                  for="name"
                  class="block text-gray-700 text-lg font-medium mb-2"
                  >الاسم بالكامل</Label
                >
                <Input
                  id="name"
                  type="text"
                  v-model="name"
                  placeholder="أدخل اسمك"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <Label
                  for="phone"
                  class="block text-gray-700 text-lg font-medium mb-2"
                  >رقم الهاتف</Label
                >
                <Input
                  id="phone"
                  type="tel"
                  v-model="phone"
                  placeholder="01000000000"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <Label
                  for="message"
                  class="block text-gray-700 text-lg font-medium mb-2"
                  >الرسالة</Label
                >
                <textarea
                  id="message"
                  rows="5"
                  v-model="message"
                  placeholder="اكتب تفاصيل طلبك أو سؤالك"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                ></textarea>
              </div>
              <Button
                type="submit"
                class="w-full bg-red-600 text-white hover:bg-red-700 text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
              >
                إرسال الرسالة
              </Button>
            </form>
          </div>

          <div>
            <h3 class="text-2xl font-bold text-gray-800 mb-6">
              معلومات التواصل
            </h3>
            <div class="space-y-6">
              <div class="flex items-center text-gray-700">
                <Phone class="h-6 w-6 text-red-600 ml-3" />
                <div>
                  <p class="font-medium">رقم الهاتف</p>
                  <p>01044054458 / 01202777049</p>
                  <p class="text-sm text-gray-500">
                    يومياً من 8 صباحاً حتى 6 مساءً
                  </p>
                </div>
              </div>
              <div class="flex items-center text-gray-700">
                <Mail class="h-6 w-6 text-red-600 ml-3" />
                <div>
                  <p class="font-medium">البريد الإلكتروني</p>
                  <p>info@delivreshop.com</p>
                  <p class="text-sm text-gray-500">نرد خلال 24 ساعة</p>
                </div>
              </div>
              <div class="flex items-center text-gray-700">
                <MapPin class="h-6 w-6 text-red-600 ml-3" />
                <div>
                  <p class="font-medium">العنوان</p>
                  <p>القاهرة الكبرى - مصر</p>
                  <p class="text-sm text-gray-500">
                    نغطي أغلب المناطق الرئيسية
                  </p>
                </div>
              </div>
              <div class="flex items-center text-gray-700">
                <Clock class="h-6 w-6 text-red-600 ml-3" />
                <div>
                  <p class="font-medium">ساعات العمل</p>
                  <p>السبت - الخميس: 8 صباحاً - 6 مساءً</p>
                  <p class="text-sm text-gray-500">
                    الجمعة: 9 صباحاً - 4 مساءً
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h4 class="text-xl font-semibold text-gray-800 mb-2">
                نضمن لك سرعة الرد
              </h4>
              <p class="text-gray-600">
                فخورين إننا دايماً متأكدين لخدمتكم سواء اتصلت، أو أرسلت إيميل،
                أو استخدمت النموذج. فريقنا هيرد عليك خلال يوم عمل واحد فقط.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="bg-gray-800 text-white py-8 px-4 text-center">
      <div class="max-w-6xl mx-auto">
        <p>&copy; 2025 Delivery Shop. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  </div>
</template>
