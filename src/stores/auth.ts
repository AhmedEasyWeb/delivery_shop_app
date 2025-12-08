import { ref } from "vue";
import { defineStore } from "pinia";
import { Preferences } from "@capacitor/preferences";
import api from "@/api/axios";
import {
  getLocalData,
  removeLocalData,
  setLocalData,
} from "@/utils/localStorage";

interface Driver {
  driver_id: number;
  driver_full_name: string;
  driver_phone: string;
  driver_city: string;
  driver_type: string;
  driver_status: string;
  is_baned: boolean;
  stationed_at: number | null;
  id_number: string;
  plate_number: string;
  license_photo: string;
  rate: number | null;
  created_at: string;
}

export const useAuthStore = defineStore("auth", () => {
  const driver = ref<Driver | null>(null);
  const user = ref<any>(null);
  const isAuthenticated = ref(false);
  const type = ref("");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function init() {
    const token = await getLocalData("sessionToken");

    if (!token) {
      isAuthenticated.value = false;
      return;
    }

    const okDriver = await checkSession();
    if (!okDriver) {
      const okRestaurant = await checkRestaurantSession();
      if (!okRestaurant) {
        await logout();
      }
    }
  }

  async function login(formData: FormData) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.post("/auth/driver/login", formData);

      await setLocalData("sessionToken", response.data.sessionToken);

      driver.value = response.data.driver;
      type.value = "driver";
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      error.value = err.message;
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function restaurantlogin(name: string, password: string) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.post("/auth/restaurant/login", {
        restaurant_name: name,
        password,
      });

      await setLocalData("sessionToken", response.data.sessionToken);

      user.value = response.data.user;
      type.value = "restaurant";
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      error.value = err.data.message;
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function checkSession() {
    try {
      const response = await api.get("/auth/driver");

      if (response.status !== 200) return false;

      if (!response?.data.user?.driver_id) return false;

      driver.value = response.data.user;
      console.log(response.data.user);
      type.value = "driver";
      isAuthenticated.value = true;
      return true;
    } catch {
      return false;
    }
  }

  async function checkRestaurantSession() {
    try {
      const response = await api.get("/api/auth/restaurant");

      if (response.status !== 200) return false;

      if (!response?.data.user?.id) return false;

      user.value = response.data.user;
      type.value = "restaurant";
      isAuthenticated.value = true;
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await removeLocalData("sessionToken");

    driver.value = null;
    user.value = null;
    isAuthenticated.value = false;
  }

  function setStationedAt(id: number) {
    if (driver.value) driver.value.stationed_at = id;
  }

  function changeCity(city: string) {
    if (driver.value) {
      driver.value.driver_city = city;
    }
  }

  return {
    driver,
    user,
    type,
    isAuthenticated,
    isLoading,
    error,
    init,
    login,
    restaurantlogin,
    checkSession,
    checkRestaurantSession,
    logout,
    setStationedAt,
    changeCity,
  };
});
