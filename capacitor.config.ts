import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sahlofolina.reader",
  appName: "Sahlo Folina",
  webDir: "public",
  backgroundColor: "#02040a",
  android: {
    backgroundColor: "#02040a",
    allowMixedContent: false,
  },
};

export default config;
