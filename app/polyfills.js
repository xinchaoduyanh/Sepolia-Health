// Lock native URL and URLSearchParams on web before any polyfills (like react-native-url-polyfill) run
if (typeof window !== 'undefined') {
  let nativeURL = window.URL;
  let nativeURLSearchParams = window.URLSearchParams;

  // Grab pristine ones from an iframe if the global one has already been polyfilled
  const isPolyfilled = !nativeURL || !nativeURL.createObjectURL || (nativeURL.createObjectURL.toString && !nativeURL.createObjectURL.toString().includes('[native code]'));
  if (isPolyfilled && typeof document !== 'undefined') {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      const container = document.body || document.documentElement;
      if (container) {
        container.appendChild(iframe);
        if (iframe.contentWindow) {
          nativeURL = iframe.contentWindow.URL;
          nativeURLSearchParams = iframe.contentWindow.URLSearchParams;
        }
        container.removeChild(iframe);
      }
    } catch (e) {
      console.warn('Failed to restore native URL in polyfills:', e);
    }
  }

  if (nativeURL) {
    let currentURL = window.URL;
    Object.defineProperty(window, 'URL', {
      get() {
        return nativeURL;
      },
      set(val) {
        currentURL = val;
      },
      configurable: true,
    });
  }

  if (nativeURLSearchParams) {
    let currentURLSearchParams = window.URLSearchParams;
    Object.defineProperty(window, 'URLSearchParams', {
      get() {
        return nativeURLSearchParams;
      },
      set(val) {
        currentURLSearchParams = val;
      },
      configurable: true,
    });
  }
}
