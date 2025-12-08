import { createRouter, createWebHistory } from "vue-router";
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
    },
    {
      path: "/",
      name: "login",
      component: LoginPage,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
    },
    {
      path: "/driver-panel",
      name: "driver-panel",
      component: DriverPanel,
    },
    {
      path: "/restaurant",
      component: RestaurantLogin,
    },
    {
      path: "/restaurant/dashboard",
      component: RestaurantHomePage,
    },
    {
      path: "/restaurant/orders",
      component: RestaurantOrders,
    },
    {
      path: "/restaurant/reports",
      component: RestaurantReports,
    },
    {
      path: "/restaurant/register",
      component: RestaurantRegister,
    },
  ],
});

export default router;
