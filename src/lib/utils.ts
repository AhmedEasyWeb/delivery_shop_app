import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { Clock, Package, Truck, XCircle } from "lucide-vue-next";
import { twMerge } from "tailwind-merge";
import { h } from "vue";

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
