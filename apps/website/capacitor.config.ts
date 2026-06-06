import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.vibeloop.app",
  appName: "VibeLoop",
  webDir: "public",
  server: {
    url: "https://app-admin-web-9tpn.vercel.app",
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#070711",
      showSpinner: false
    }
  }
}

export default config
