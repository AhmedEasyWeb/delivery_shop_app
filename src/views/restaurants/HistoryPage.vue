<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import Header from "@/components/Header.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Loader2,
  Calendar,
  Search,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  User,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import api from "@/api/axios";
import type { Order } from "@/types";
import { toast } from "vue-sonner";
import CustomPagination from "@/components/CustomPagination.vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  getStatus,
  getPaymentMethod,
  formatEGDate,
  getEGToday,
} from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

const EGYPT_TZ = "Africa/Cairo";

const parseEGDate = (d: string | null | undefined) => {
  if (!d) return null;
  if (d.endsWith("Z")) return dayjs(d.replace("Z", "")).tz(EGYPT_TZ, true);
  return dayjs(d).tz(EGYPT_TZ);
};

const diffMins = (
  from: string | null | undefined,
  to: string | null | undefined,
): string | null => {
  const a = parseEGDate(from);
  const b = parseEGDate(to);
  if (!a || !b) return null;
  const mins = b.diff(a, "minute");
  if (mins < 60) return `${mins} دقيقة`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} ساعة`;
};

const formatEGTime = (d: string | null | undefined) => {
  if (!d) return "";
  const parsed = parseEGDate(d);
  return parsed ? parsed.format("hh:mm A") : "";
};

const getOrderStatusBadgeClass = (status: string) => {
  switch (status) {
    case "preparing":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400";
    case "ready":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400";
    case "picked-up":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/25 dark:text-indigo-300";
    case "delivered":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/25 dark:text-emerald-400";
    case "canceled":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/25 dark:text-rose-400";
    default:
      return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
};

const getStatusIconComponent = (status: string) => {
  switch (status) {
    case "preparing":
      return Clock;
    case "ready":
      return Package;
    case "picked-up":
      return Truck;
    case "delivered":
      return CheckCircle2;
    case "canceled":
      return XCircle;
    default:
      return Clock;
  }
};

const timelineProgressStyle = (order: Order) => {
  if (order.order_status === "delivered") return { width: "100%", right: "0%" };
  if (order.order_status === "picked-up") return { width: "66%", right: "0%" };
  if (order.order_status === "ready") return { width: "33%", right: "0%" };
  return { width: "0%", right: "0%" };
};

const orders = ref<Order[]>([]);
const loading = ref(false);
const error = ref("");
const status = ref<any>({});
const fromDate = ref("");
const toDate = ref("");

const currentPage = ref(1);
const itemsPerPage = ref(50);

const totalPages = computed(() =>
  Math.ceil(status.value.sum_of_orders / itemsPerPage.value),
);

const fetchOrdersByDate = async () => {
  if (!fromDate.value || !toDate.value) {
    toast.warning("اختار تاريخ البداية والنهاية الأول");
    return;
  }
  loading.value = true;

  try {
    const res = await api.get(
      `/orders?from=${fromDate.value}&to=${toDate.value}&page=${currentPage.value}`,
    );
    console.log(res.data.orders);
    orders.value = res.data.orders || [];
  } catch (err: any) {
    error.value = err.message || "فشل في جلب الطلبات";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await api.get(
      `/orders?from=${fromDate.value}&to=${toDate.value}&status=true&page=${currentPage.value}`,
    );
    status.value = res.data.stats || {};
  } catch (err: any) {
    console.error("Failed to fetch stats:", err);
  }
};

const handleSearch = async () => {
  currentPage.value = 1;
  await fetchOrdersByDate();
  await fetchStats();
};

onMounted(async () => {
  const today = getEGToday();
  fromDate.value = today!;
  toDate.value = today!;
  await fetchOrdersByDate();
  await fetchStats();
});

watch(currentPage, async (newPage, oldPage) => {
  if (newPage !== oldPage) {
    await fetchOrdersByDate();
  }
});
</script>

<template>
  <Header />

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
    <!-- Header Hero Banner -->
    <div
      class="bg-linear-to-l from-primary/10 via-background to-background border-b border-border/40 pb-6 mb-2 p-2 rounded"
    >
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1
            class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-primary to-primary/75 bg-clip-text text-transparent"
          >
            سجل الطلبات
          </h1>
          <p class="text-muted-foreground mt-1.5 text-sm sm:text-base">
            استعرض، ابحث، وحلل أداء جميع طلبات المطعم وتابع مراحل التجهيز
            والتسليم والمدة المستغرقة في التوصيل بكل سهولة.
          </p>
        </div>
      </div>
    </div>

    <!-- Period Selection Filter -->
    <Card class="bg-card/40 backdrop-blur-md shadow-sm border-border/50">
      <CardHeader class="pb-4">
        <CardTitle class="text-lg font-bold flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          تحديد الفترة الزمنية للبحث
        </CardTitle>
        <CardDescription>
          اختر تاريخ البداية والنهاية لعرض الطلبات والإحصائيات الخاصة بتلك
          الفترة (صفحة {{ currentPage }} من {{ totalPages || 1 }})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end"
        >
          <div class="space-y-2">
            <label
              class="text-sm font-semibold text-foreground/80 flex items-center gap-1.5"
            >
              <Calendar class="w-4 h-4 text-muted-foreground" />
              من تاريخ
            </label>
            <Input
              type="date"
              v-model="fromDate"
              class="w-full pl-3 pr-4 py-2 border-border focus:ring-primary focus:border-primary rounded-lg text-sm bg-background/50"
            />
          </div>
          <div class="space-y-2">
            <label
              class="text-sm font-semibold text-foreground/80 flex items-center gap-1.5"
            >
              <Calendar class="w-4 h-4 text-muted-foreground" />
              إلى تاريخ
            </label>
            <Input
              type="date"
              v-model="toDate"
              class="w-full pl-3 pr-4 py-2 border-border focus:ring-primary focus:border-primary rounded-lg text-sm bg-background/50"
            />
          </div>
          <div>
            <Button
              @click="handleSearch"
              :disabled="loading"
              class="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg shadow-sm shadow-primary/10 hover:shadow transition-all flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <Search v-else class="w-4 h-4" />
              <span>عرض وتحديث البيانات</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Stats Dashboard Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Card 1: Total Orders -->
      <Card
        class="relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-card to-card/90 border-border/50"
      >
        <div
          class="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"
        ></div>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-sm font-medium text-muted-foreground">
                إجمالي الطلبات
              </p>
              <h3
                class="text-3xl font-extrabold text-foreground tracking-tight"
              >
                {{ status.sum_of_orders || 0 }}
              </h3>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300"
            >
              <Clock class="w-6 h-6" />
            </div>
          </div>
          <div
            class="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span>طلب مسجل خلال هذه الفترة</span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Completed Orders -->
      <Card
        class="relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-card to-card/90 border-border/50"
      >
        <div
          class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"
        ></div>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-sm font-medium text-muted-foreground">
                الطلبات المكتملة
              </p>
              <h3
                class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight"
              >
                {{ status.sum_of_completed_orders || 0 }}
              </h3>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300"
            >
              <CheckCircle2 class="w-6 h-6" />
            </div>
          </div>
          <div
            class="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span>تم تسليمها بنجاح للعملاء</span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 3: Success Rate -->
      <Card
        class="relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-card to-card/90 border-border/50 sm:col-span-2 lg:col-span-1"
      >
        <div
          class="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"
        ></div>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div class="space-y-1 w-full">
              <p class="text-sm font-medium text-muted-foreground">
                معدل نجاح التوصيل
              </p>
              <div class="flex items-baseline gap-2">
                <h3
                  class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight"
                >
                  {{
                    status.sum_of_orders
                      ? (
                          (status.sum_of_completed_orders /
                            status.sum_of_orders) *
                          100
                        ).toFixed(0)
                      : 0
                  }}%
                </h3>
                <span class="text-xs text-muted-foreground"
                  >من إجمالي الطلبات</span
                >
              </div>
              <!-- Success Rate Progress Bar -->
              <div
                class="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden"
              >
                <div
                  class="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  :style="{
                    width: status.sum_of_orders
                      ? (status.sum_of_completed_orders /
                          status.sum_of_orders) *
                          100 +
                        '%'
                      : '0%',
                  }"
                ></div>
              </div>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300"
            >
              <TrendingUp class="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Orders Feed -->
    <Card class="shadow-sm border-border/50">
      <CardHeader
        class="border-b border-border/40 pb-4 flex flex-row items-center justify-between"
      >
        <div>
          <CardTitle class="text-xl font-bold text-foreground"
            >الطلبات المستخرجة</CardTitle
          >
          <CardDescription
            >قائمة بجميع الطلبات المفصلة للفترة المحددة مرتبة
            زمنياً</CardDescription
          >
        </div>
      </CardHeader>
      <CardContent class="pt-6">
        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex flex-col justify-center items-center py-20 space-y-4"
        >
          <Loader2 class="h-10 w-10 animate-spin text-primary" />
          <span class="text-sm font-medium text-muted-foreground"
            >جاري استيراد وتجهيز سجلات الطلبات...</span
          >
        </div>

        <!-- Empty State -->
        <div v-else-if="!orders.length" class="text-center py-16 space-y-4">
          <div
            class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground"
          >
            <Clock class="h-8 w-8" />
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-foreground">لا توجد سجلات</h3>
            <p class="text-muted-foreground text-sm max-w-xs mx-auto">
              لم يتم العثور على طلبات مسجلة خلال النطاق الزمني المحدد.
            </p>
          </div>
        </div>

        <!-- Orders Grid / Feed -->
        <div v-else class="space-y-6">
          <template v-for="order in orders" :key="order.order_id">
            <div
              :class="[
                'relative overflow-hidden border border-border/80 dark:border-border/40 rounded-xl bg-card p-5 hover:shadow-md transition-all duration-300',
                'border-r-4',
                order.order_status === 'delivered'
                  ? 'border-r-emerald-500 shadow-sm shadow-emerald-500/5'
                  : order.order_status === 'picked-up'
                    ? 'border-r-indigo-500 shadow-sm shadow-indigo-500/5'
                    : order.order_status === 'ready'
                      ? 'border-r-blue-500 shadow-sm shadow-blue-500/5'
                      : order.order_status === 'canceled'
                        ? 'border-r-rose-500 bg-rose-500/5 dark:bg-rose-950/5'
                        : 'border-r-amber-500',
              ]"
            >
              <!-- Top Action/Status row -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border/50 pb-4"
              >
                <div class="flex items-center flex-wrap gap-2.5">
                  <span
                    class="font-extrabold text-base text-primary tracking-wide bg-primary/10 px-2.5 py-1 rounded-md"
                  >
                    #{{ order.order_id }}
                  </span>
                  <Badge
                    variant="outline"
                    :class="[
                      'px-2.5 py-1 flex items-center gap-1.5 rounded-full text-xs font-semibold shadow-sm border border-current/25',
                      getOrderStatusBadgeClass(order.order_status),
                    ]"
                  >
                    <component
                      :is="getStatusIconComponent(order.order_status)"
                      class="w-3.5 h-3.5"
                    />
                    <span>{{ getStatus(order.order_status) }}</span>
                  </Badge>
                  <Badge
                    v-if="order.driver_id"
                    class="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/25 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                  >
                    <User class="w-3.5 h-3.5" />
                    <span>تم تعيين سائق</span>
                  </Badge>
                </div>

                <div class="flex items-center gap-4 sm:text-left text-right">
                  <div class="space-y-0.5">
                    <p class="text-xs text-muted-foreground">التاريخ والوقت</p>
                    <p
                      class="text-xs font-medium text-foreground/80 flex items-center gap-1"
                    >
                      <Calendar class="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{{ formatEGDate(order.created_at) }}</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Mid Content Info Row -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <!-- Customer & Info Cards (Right) -->
                <div
                  class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <!-- Tel Card -->
                  <div
                    class="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/30 hover:bg-muted/60 transition-colors"
                  >
                    <div
                      class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-sm"
                    >
                      <Phone class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[10px] text-muted-foreground block"
                        >رقم الهاتف</span
                      >
                      <a
                        :href="'tel:' + order.user_phone"
                        class="text-sm font-semibold hover:underline text-foreground"
                      >
                        {{ order.user_phone }}
                      </a>
                    </div>
                  </div>

                  <!-- Address/City Card -->
                  <div
                    class="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/30 hover:bg-muted/60 transition-colors"
                  >
                    <div
                      class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-sm"
                    >
                      <MapPin class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[10px] text-muted-foreground block"
                        >المدينة / العنوان</span
                      >
                      <span class="text-sm font-semibold text-foreground">
                        {{ order.order_city }}
                      </span>
                    </div>
                  </div>

                  <!-- Payment Method Card -->
                  <div
                    class="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/30 hover:bg-muted/60 transition-colors"
                  >
                    <div
                      class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-sm"
                    >
                      <CreditCard class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[10px] text-muted-foreground block"
                        >طريقة الدفع</span
                      >
                      <span class="text-sm font-semibold text-foreground">
                        {{ getPaymentMethod(order.payment_method) }}
                      </span>
                    </div>
                  </div>

                  <!-- Notes Card -->
                  <div
                    v-if="order.order_notes"
                    class="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 hover:bg-amber-500/10 transition-colors sm:col-span-2"
                  >
                    <div
                      class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-sm shrink-0"
                    >
                      <MessageSquare class="w-4 h-4" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-[10px] text-amber-600 font-bold block"
                        >ملاحظات الطلب</span
                      >
                      <p
                        class="text-xs text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed font-medium truncate sm:whitespace-normal"
                      >
                        {{ order.order_notes }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Receipt image / Total prices Column (Left) -->
                <div
                  class="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-xl border border-border/40 w-full"
                >
                  <div
                    class="flex items-center gap-4 w-full justify-between sm:justify-start lg:justify-between border-b lg:border-b border-border/40 pb-3 sm:pb-0 lg:pb-3 sm:border-b-0"
                  >
                    <div class="text-right">
                      <span class="text-[10px] text-muted-foreground block"
                        >قيمة الطلب</span
                      >
                      <span
                        class="text-2xl font-black text-primary tracking-tight"
                      >
                        {{ order.order_total_price }}
                        <span class="text-xs font-bold text-muted-foreground"
                          >ج.م</span
                        >
                      </span>
                    </div>
                    <div class="text-left bg-muted/60 px-2.5 py-1 rounded-lg">
                      <span class="text-[9px] text-muted-foreground block"
                        >التوصيل</span
                      >
                      <span class="text-sm font-bold text-foreground">
                        {{ order.order_delivery_cost }} ج.م
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="order.order_receipt"
                    class="relative group self-center shrink-0"
                  >
                    <img
                      :src="'https://deliveryshop.cloud' + order.order_receipt"
                      alt="Receipt Image"
                      class="h-20 w-20 rounded-lg object-cover border border-border/80 shadow-sm group-hover:scale-105 transition-all duration-300"
                    />
                    <a
                      :href="'https://deliveryshop.cloud' + order.order_receipt"
                      target="_blank"
                      class="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <span
                        class="text-[10px] font-semibold bg-primary/95 text-primary-foreground px-2 py-0.5 rounded shadow-sm"
                        >عرض الفاتورة</span
                      >
                    </a>
                  </div>
                </div>
              </div>

              <!-- visual progress timeline (Hidden for canceled orders) -->
              <!-- visual progress timeline (Hidden for canceled orders) -->
              <div
                v-if="order.order_status !== 'canceled'"
                class="mt-6 pt-5 border-t border-border/50"
              >
                <!-- Mobile Timeline (Vertical) - Displays on small viewports -->
                <div
                  class="sm:hidden relative border-r border-border/60 space-y-6"
                >
                  <!-- Step 1: Created -->
                  <div class="relative flex items-start gap-1">
                    <div
                      class="absolute -right-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm ring-4 ring-background"
                    >
                      <CheckCircle2 class="w-2.5 h-2.5" />
                    </div>
                    <div class="flex flex-col mr-5">
                      <span class="text-xs font-bold text-foreground"
                        >تم الطلب</span
                      >
                      <span
                        class="text-[10px] text-muted-foreground font-medium"
                      >
                        {{ formatEGTime(order.created_at) }}
                      </span>
                    </div>
                  </div>

                  <!-- Step 2: Ready -->
                  <div class="relative flex items-start gap-1">
                    <div
                      :class="[
                        'absolute -right-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ring-4 ring-background transition-all duration-300',
                        order.ready_at
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <Package class="w-2.5 h-2.5" />
                    </div>
                    <div class="flex flex-col mr-5">
                      <span
                        :class="[
                          'text-xs font-bold transition-colors duration-300',
                          order.ready_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                      >
                        جاهز للاستلام
                      </span>
                      <span
                        v-if="order.ready_at"
                        class="text-[10px] text-muted-foreground font-medium"
                      >
                        {{ formatEGTime(order.ready_at) }}
                      </span>
                      <span
                        v-if="
                          order.ready_at &&
                          diffMins(order.created_at, order.ready_at)
                        "
                        class="inline-flex text-[9px] text-amber-600 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱ {{ diffMins(order.created_at, order.ready_at) }}
                      </span>
                    </div>
                  </div>

                  <!-- Step 3: Picked Up -->
                  <div class="relative flex items-start gap-1">
                    <div
                      :class="[
                        'absolute -right-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ring-4 ring-background transition-all duration-300',
                        order.picked_up_at
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <Truck class="w-2.5 h-2.5" />
                    </div>
                    <div class="flex flex-col mr-5">
                      <span
                        :class="[
                          'text-xs font-bold transition-colors duration-300',
                          order.picked_up_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                      >
                        تم الاستلام
                      </span>
                      <span
                        v-if="order.picked_up_at"
                        class="text-[10px] text-muted-foreground font-medium"
                      >
                        {{ formatEGTime(order.picked_up_at) }}
                      </span>
                      <span
                        v-if="
                          order.picked_up_at &&
                          diffMins(order.ready_at, order.picked_up_at)
                        "
                        class="inline-flex text-[9px] text-indigo-600 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱ {{ diffMins(order.ready_at, order.picked_up_at) }}
                      </span>
                    </div>
                  </div>

                  <!-- Step 4: Delivered -->
                  <div class="relative flex items-start gap-1">
                    <div
                      :class="[
                        'absolute -right-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ring-4 ring-background transition-all duration-300',
                        order.delivered_at
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <CheckCircle2 class="w-2.5 h-2.5" />
                    </div>
                    <div class="flex flex-col mr-5">
                      <span
                        :class="[
                          'text-xs font-bold transition-colors duration-300',
                          order.delivered_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                      >
                        تم التوصيل
                      </span>
                      <span
                        v-if="order.delivered_at"
                        class="text-[10px] text-muted-foreground font-medium"
                      >
                        {{ formatEGTime(order.delivered_at) }}
                      </span>
                      <span
                        v-if="
                          order.delivered_at &&
                          diffMins(order.picked_up_at, order.delivered_at)
                        "
                        class="inline-flex text-[9px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱
                        {{ diffMins(order.picked_up_at, order.delivered_at) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Desktop Timeline (Horizontal) - Displays on larger viewports -->
                <div class="hidden sm:block">
                  <div
                    class="flex items-center justify-between max-w-3xl mx-auto relative px-3"
                  >
                    <!-- Line Background -->
                    <div
                      class="absolute right-8 left-8 top-[15px] h-0.5 bg-muted dark:bg-muted/20"
                    ></div>
                    <!-- Active Line Progress -->
                    <div
                      class="absolute right-8 top-[15px] h-0.5 bg-primary transition-all duration-500"
                      :style="timelineProgressStyle(order)"
                    ></div>

                    <!-- Step 1: Created -->
                    <div class="flex flex-col items-center relative z-10 mb-5">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-semibold text-xs shadow-sm ring-4 ring-background"
                      >
                        <CheckCircle2 class="w-4 h-4" />
                      </div>
                      <span class="text-[11px] font-bold mt-2 text-foreground"
                        >تم الطلب</span
                      >
                      <span
                        class="text-[9px] text-muted-foreground font-medium mt-0.5"
                        >{{ formatEGTime(order.created_at) }}</span
                      >
                    </div>

                    <!-- Step 2: Ready -->
                    <div class="flex flex-col items-center relative z-10">
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-sm ring-4 ring-background',
                          order.ready_at
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        ]"
                      >
                        <Package class="w-4 h-4" />
                      </div>
                      <span
                        :class="[
                          'text-[11px] font-bold mt-2',
                          order.ready_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                        >جاهز للاستلام</span
                      >
                      <span
                        v-if="order.ready_at"
                        class="text-[9px] text-muted-foreground font-medium mt-0.5"
                        >{{ formatEGTime(order.ready_at) }}</span
                      >
                      <span
                        v-if="
                          order.ready_at &&
                          diffMins(order.created_at, order.ready_at)
                        "
                        class="text-[9px] text-amber-600 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱ {{ diffMins(order.created_at, order.ready_at) }}
                      </span>
                    </div>

                    <!-- Step 3: Picked Up -->
                    <div class="flex flex-col items-center relative z-10">
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-sm ring-4 ring-background',
                          order.picked_up_at
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        ]"
                      >
                        <Truck class="w-4 h-4" />
                      </div>
                      <span
                        :class="[
                          'text-[11px] font-bold mt-2',
                          order.picked_up_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                        >تم الاستلام</span
                      >
                      <span
                        v-if="order.picked_up_at"
                        class="text-[9px] text-muted-foreground font-medium mt-0.5"
                        >{{ formatEGTime(order.picked_up_at) }}</span
                      >
                      <span
                        v-if="
                          order.picked_up_at &&
                          diffMins(order.ready_at, order.picked_up_at)
                        "
                        class="text-[9px] text-indigo-600 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱ {{ diffMins(order.ready_at, order.picked_up_at) }}
                      </span>
                    </div>

                    <!-- Step 4: Delivered -->
                    <div class="flex flex-col items-center relative z-10">
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-sm ring-4 ring-background',
                          order.delivered_at
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-muted text-muted-foreground',
                        ]"
                      >
                        <CheckCircle2 class="w-4 h-4" />
                      </div>
                      <span
                        :class="[
                          'text-[11px] font-bold mt-2',
                          order.delivered_at
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        ]"
                        >تم التوصيل</span
                      >
                      <span
                        v-if="order.delivered_at"
                        class="text-[9px] text-muted-foreground font-medium mt-0.5"
                        >{{ formatEGTime(order.delivered_at) }}</span
                      >
                      <span
                        v-if="
                          order.delivered_at &&
                          diffMins(order.picked_up_at, order.delivered_at)
                        "
                        class="text-[9px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-1"
                      >
                        ⏱
                        {{ diffMins(order.picked_up_at, order.delivered_at) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Canceled warning for canceled orders -->
              <div
                v-else
                class="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col gap-2 text-rose-700 dark:text-rose-400"
              >
                <div class="flex items-center gap-2">
                  <XCircle class="w-5 h-5 shrink-0 animate-pulse" />
                  <span class="text-xs font-semibold"
                    >تم إلغاء هذا الطلب ولا يمكن تتبع مراحل التوصيل الخاصة
                    به.</span
                  >
                </div>
                <div
                  v-if="order.cancelation_reason"
                  class="text-xs font-semibold mr-7 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10"
                >
                  <span class="text-rose-600">سبب الإلغاء:</span>
                  <span class="font-extrabold text-rose-800">
                    {{ order.cancelation_reason }}</span
                  >
                </div>
              </div>
            </div>
          </template>

          <!-- Pagination -->
          <div class="pt-4">
            <CustomPagination
              v-if="!loading && orders.length > 0"
              :current-page="currentPage"
              :total-items="status.sum_of_orders"
              :items-per-page="itemsPerPage"
              @update:current-page="currentPage = $event"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
