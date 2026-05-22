'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    const dismissed = localStorage.getItem('vibeloop_install_dismissed');

    function handleBeforeInstallPrompt(event: any) {
      event.preventDefault();
      setInstallEvent(event);

      if (!dismissed && !standalone) {
        setVisible(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      setVisible(false);
      return;
    }

    installEvent.prompt();

    try {
      await installEvent.userChoice;
    } catch {
      // ignore
    }

    setInstallEvent(null);
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem('vibeloop_install_dismissed', 'true');
    setVisible(false);
  }

  if (!visible || isStandalone) return null;

  return (
    <div className="pwaInstallPrompt">
      <div className="pwaInstallIcon">▶</div>

      <div>
        <b>Install VibeLoop</b>
        <span>Use it like a real mobile app with splash screen and home icon.</span>
      </div>

      <button type="button" onClick={installApp}>Install</button>
      <button type="button" onClick={dismiss}>×</button>
    </div>
  );
}
