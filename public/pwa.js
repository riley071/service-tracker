/* Browser-only installation UI; native builds do not load this file. */
(() => {
  if (!window.isSecureContext) return;
  if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(console.error);
  }
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone()) return;
  let prompt;
  let banner;
  let dismissed = false;
  const hide = () => { banner?.remove(); banner = undefined; };
  const show = (ios) => {
    if (dismissed || banner || standalone()) return;
    banner = document.createElement('aside');
    banner.setAttribute('aria-label', 'Install Workfolio');
    banner.style.cssText = 'position:fixed;bottom:max(12px,env(safe-area-inset-bottom));left:12px;right:12px;max-width:440px;margin:auto;z-index:10000;background:#132F2A;color:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px #0003;font:15px/1.5 system-ui;';
    const text = document.createElement('p');
    text.style.margin = '0 0 12px';
    text.textContent = ios ? 'Install Workfolio: open the Share menu in Safari, then choose Add to Home Screen.' : 'Install Workfolio on your home screen for quick access.';
    banner.append(text);
    const button = (label, action) => {
      const element = document.createElement('button');
      element.textContent = label;
      element.style.cssText = 'min-height:44px;padding:8px 16px;margin-right:8px;border:0;border-radius:8px;background:#DBEF9E;color:#132F2A;font:600 15px system-ui;cursor:pointer;';
      element.onclick = action;
      banner.append(element);
      return element;
    };
    if (!ios) button('Install app', async () => {
      if (!prompt) return;
      const current = prompt;
      prompt = undefined;
      hide();
      try { await current.prompt(); await current.userChoice; } catch (error) { console.error(error); }
    });
    button('Dismiss', () => { dismissed = true; hide(); });
    document.body.append(banner);
  };
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt = event;
    show(false);
  });
  window.addEventListener('appinstalled', hide);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => { if (event.matches) hide(); });
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) show(true);
})();
