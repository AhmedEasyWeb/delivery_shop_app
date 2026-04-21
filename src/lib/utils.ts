import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { Clock, Package, Truck, XCircle } from "lucide-vue-next";
import { twMerge } from "tailwind-merge";
import { h } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/ar";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ar");

const EGYPT_TZ = "Africa/Cairo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStatusIcon(status: string) {
  switch (status) {
    case "preparing":
      return h(Clock, { class: "h-4 w-4" });
    case "ready":
      return h(Package, { class: "h-4 w-4" });
    case "picked-up":
      return h(Truck, { class: "h-4 w-4" });
    case "canceled":
      return h(XCircle, { class: "h-4 w-4" });
    default:
      return h(Clock, { class: "h-4 w-4" });
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "preparing":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "ready":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "picked-up":
      return "bg-primary/10 text-primary border-primary/20";
    case "canceled":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getStatus(status: string) {
  switch (status) {
    case "preparing":
      return "في التحضير";
    case "ready":
      return "جاهز للاستلام";
    case "picked-up":
      return "تم الاستلام";
    case "delivered":
      return "تم التوصيل";
    case "canceled":
      return "ملغي";
    default:
      return "في التحضير";
  }
}

const getPaymentMethod = (method?: string) => {
  if (!method) {
    return "لا يوجد";
  }
  switch (method) {
    case "cash":
      return "الدفع عند الاستلام";
    case "ewallet":
      return "المحافظ الإلكترونية (فودافون كاش، إلخ)";
    case "card":
      return "بطاقة ائتمان / ميزة";
    case "instapay":
      "إنستا باي (Instapay)";
  }
};

export { getStatusIcon, getStatusColor, getStatus, getPaymentMethod };

export function formatEGDate(
  dateInput: string | number | Date | null | undefined,
): string {
  if (!dateInput) return "";
  try {
    let d;
    if (typeof dateInput === "string" && dateInput.endsWith("Z")) {
      d = dayjs(dateInput.replace("Z", "")).tz(EGYPT_TZ, true);
    } else {
      d = dayjs(dateInput).tz(EGYPT_TZ);
    }
    // Standardizing to the Egypt wall-clock time
    return d.format("YYYY-MM-DD HH:mm:ss");
  } catch (e) {
    return String(dateInput);
  }
}

export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
): string {
  if (!dateInput) return "";
  try {
    return dayjs(dateInput).tz(EGYPT_TZ).format("D/M/YYYY h:mm A");
  } catch (e) {
    return String(dateInput);
  }
}

export function formatToEgyptLocale(
  dateInput: string | number | Date | null | undefined,
): string {
  if (!dateInput) return "";
  try {
    let d;
    if (typeof dateInput === "string" && dateInput.endsWith("Z")) {
      d = dayjs(dateInput.replace("Z", "")).tz(EGYPT_TZ, true);
    } else {
      d = dayjs(dateInput).tz(EGYPT_TZ);
    }
    return d.locale("ar").format("D/M/YYYY h:mm A");
  } catch (e) {
    return String(dateInput);
  }
}

export function formatToEgyptDate(
  dateInput: string | number | Date | null | undefined,
): string {
  if (!dateInput) return "";
  try {
    let d;
    if (typeof dateInput === "string" && dateInput.endsWith("Z")) {
      d = dayjs(dateInput.replace("Z", "")).tz(EGYPT_TZ, true);
    } else {
      d = dayjs(dateInput).tz(EGYPT_TZ);
    }
    return d.locale("ar").format("D/M/YYYY");
  } catch (e) {
    return String(dateInput);
  }
}

export function getEGToday(): string {
  return dayjs().tz(EGYPT_TZ).format("YYYY-MM-DD");
}

export function getEGTimestamp(
  dateInput?: string | number | Date | null,
): string {
  const d = dateInput ? dayjs(dateInput).tz(EGYPT_TZ) : dayjs().tz(EGYPT_TZ);
  return d.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}
