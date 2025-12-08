import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.webmadeeasy.delivery_shop",
  appName: "Delivery Shop",
  webDir: "dist",
  server: {
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
