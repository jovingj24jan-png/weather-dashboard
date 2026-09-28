import { useCallback, useEffect, useState } from 'react';

// Chrome fires `beforeinstallprompt` only when it has decided the app is
// installable. We keep that event and expose it, so an "Install" button is
// shown only when installation is actually possible — never a dead button.
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault(); // show our own button instead of the mini-infobar
      setPromptEvent(event);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null); // the event can only be used once
  }, [promptEvent]);

  return { canInstall: !!promptEvent, install };
}
