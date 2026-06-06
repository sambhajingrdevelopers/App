"use client"

import { useEffect, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null)
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      setInstalled(true)
      return
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const onInstalled = () => {
      setInstalled(true)
      setVisible(false)
      setInstallEvent(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function installApp() {
    if (!installEvent) {
      setVisible(false)
      return
    }

    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome === "accepted") {
      setInstalled(true)
      setVisible(false)
    }

    setInstallEvent(null)
  }

  if (installed || !visible) return null

  return (
    <div className="vlxPwaInstall">
      <div>
        <b>Install VibeLoop</b>
        <span>Open like a real mobile app.</span>
      </div>
      <button type="button" onClick={installApp}>Install</button>
      <button type="button" className="close" onClick={() => setVisible(false)}>×</button>
    </div>
  )
}
