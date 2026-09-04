export function registerServiceWorker() {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("./sw.js");
    });
  }
}
