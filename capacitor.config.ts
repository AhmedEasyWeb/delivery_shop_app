import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.webmadeeasy.delivery_shop",
  appName: "Delivery Shop",
  webDir: "dist",
  server: {
    cleartext: true,
    url: "http:192.168.1.90:5173",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
