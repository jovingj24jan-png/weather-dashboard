// Registers the service worker in production builds only. The path and scope
// come from Vite's base URL, so on GitHub Pages this is
// /weather-dashboard/sw.js with scope /weather-dashboard/ (never the site root).
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Without a worker the site still works normally online.
    });
  });
}
