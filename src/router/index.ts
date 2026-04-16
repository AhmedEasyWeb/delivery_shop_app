import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import LandingPage from "../views/LandingPage.vue";
import LoginPage from "../views/LoginPage.vue";
import RegisterPage from "../views/RegisterPage.vue";
import DriverPanel from "../views/DriverPanel.vue";
import RestaurantLogin from "../views/restaurants/LoginPage.vue";
import RestaurantHomePage from "../views/restaurants/HomePage.vue";
import RestaurantOrders from "../views/restaurants/HistoryPage.vue";
import RestaurantReports from "../views/restaurants/OrderReportsPage.vue";
import RestaurantRegister from "../views/restaurants/RegisterPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/landing",
      name: "landing",
      component: LandingPage,
      meta: { public: true },
    },
    { path: "/", name: "login", component: LoginPage, meta: { public: true } },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
      meta: { public: true },
    },
    {
      path: "/restaurant",
      name: "res-login",
      component: RestaurantLogin,
      meta: { public: true },
    },
    {
      path: "/restaurant/register",
      name: "res-reg",
      component: RestaurantRegister,
      meta: { public: true },
    },
    {
      path: "/driver-panel",
      name: "driver-panel",
      component: DriverPanel,
      meta: { role: "driver" },
    },
    {
      path: "/restaurant/dashboard",
      component: RestaurantHomePage,
      meta: { role: "restaurant" },
    },
    {
      path: "/restaurant/orders",
      component: RestaurantOrders,
      meta: { role: "restaurant" },
    },
    {
      path: "/restaurant/reports",
      component: RestaurantReports,
      meta: { role: "restaurant", subRole: "owner" },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated) {
    await auth.init();
  }

  if (to.meta.public) {
    return next();
  }

  if (to.meta.role === "driver") {
    if (auth.isAuthenticated && auth.type === "driver") {
      return next();
    }
    return next("/");
  }

  if (to.meta.role === "restaurant") {
    if (auth.isAuthenticated && auth.type === "restaurant") {
      if (to.meta.subRole === "owner") {
        if (auth.user?.role === "owner") {
          return next();
        } else {
          return next("/restaurant/dashboard");
        }
      }
      return next();
    }
    return next("/restaurant");
  }

  next();
});

export default router;
