<script lang="ts" setup>
import { ref, watch, nextTick, onUnmounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X } from "lucide-vue-next";

// Fix Leaflet default marker icon (broken with Vite/Webpack bundlers)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DriverLocation {
  lat: number;
  lng: number;
}

const props = defineProps<{
  driverId: number | null;
  modelValue: boolean;
  messages: any[];
  sendMessage: (data: object) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = ref(props.modelValue);
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let driverMarker: L.Marker | null = null;
let hasInitialView = false;

const requestDriverLocation = (id: number) => {
  props.sendMessage({
    type: "get_driver_location",
    driver_id: id,
    restaurant_id: true,
  });
};

const updateDriverMarker = (location: DriverLocation) => {
  if (!map) return;

  const { lat, lng } = location;

  const customIcon = L.icon({
    iconUrl: "/map.webp",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  if (!driverMarker) {
    driverMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
    driverMarker.setIcon(customIcon);
  }

  // Only pan/zoom to driver on the first location update;
  // subsequent updates only move the marker so user zoom is preserved.
  if (!hasInitialView) {
    map.setView([lat, lng], 15);
    hasInitialView = true;
  }
};

let intervalId: number | null = null;

const startLocationInterval = (driverId: number) => {
  if (intervalId) return;

  intervalId = window.setInterval(() => {
    requestDriverLocation(driverId);
  }, 3000);
};

const stopLocationInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const close = () => {
  emit("update:modelValue", false);
};

watch(
  () => props.messages,
  (msgs) => {
    const last = msgs[msgs.length - 1];
    if (!last) return;

    if (
      last.type === "driver_location" &&
      last.driver_id === props.driverId &&
      last.location
    ) {
      updateDriverMarker(last.location);
    }
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  (val) => (visible.value = val),
);

watch(visible, async (val) => {
  if (val && props.driverId) {
    await nextTick();

    if (!map && mapContainer.value) {
      map = L.map(mapContainer.value).setView([30.0626, 31.2497], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      setTimeout(() => map?.invalidateSize(), 200);
    }

    if (driverMarker) {
      driverMarker.remove();
      driverMarker = null;
    }
    hasInitialView = false;

    requestDriverLocation(props.driverId);
    startLocationInterval(props.driverId);
  }

  if (!val) {
    stopLocationInterval();
  }
});

onUnmounted(() => {
  stopLocationInterval();
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="modal-backdrop" v-show="visible" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close"><X /></button>
      <div ref="mapContainer" class="map-container"></div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  position: relative;
  width: 80%;
  max-width: 600px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
}

.map-container {
  width: 100%;
  height: 400px;
}
</style>
