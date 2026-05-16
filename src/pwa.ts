import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function showInstallBanner(
  mode: 'install' | 'ios',
  onInstall?: () => void,
): void {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner no-print';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Install app');

  if (mode === 'ios') {
    banner.innerHTML = `
      <p class="pwa-install-banner__text">
        <strong>Install on iPhone/iPad:</strong> tap <strong>Share</strong>, then
        <strong>Add to Home Screen</strong>.
      </p>
      <button type="button" class="pwa-install-banner__dismiss" aria-label="Dismiss">×</button>
    `;
  } else {
    banner.innerHTML = `
      <p class="pwa-install-banner__text">
        <strong>Install app</strong> — open from your home screen like a regular app.
      </p>
      <button type="button" class="pwa-install-banner__install">Install</button>
      <button type="button" class="pwa-install-banner__dismiss" aria-label="Dismiss">×</button>
    `;
  }

  document.body.appendChild(banner);

  banner.querySelector('.pwa-install-banner__install')?.addEventListener('click', () => {
    onInstall?.();
  });

  banner.querySelector('.pwa-install-banner__dismiss')?.addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('pwa-install-dismissed', '1');
  });
}

export function initPwa(): void {
  registerSW({ immediate: true });

  if (isStandalone() || sessionStorage.getItem('pwa-install-dismissed')) return;

  let deferred: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    showInstallBanner('install', async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      document.getElementById('pwa-install-banner')?.remove();
    });
  });

  if (isIos()) {
    showInstallBanner('ios');
  }
}
