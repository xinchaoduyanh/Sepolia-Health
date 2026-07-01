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
      console.warn('Failed to restore native URL in custom entrypoint:', e);
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
      // Must be non-configurable: React Native's polyfillGlobal() (setUpXHR.js)
      // checks Object.getOwnPropertyDescriptor(...).configurable and silently
      // skips redefining the property when it's false. configurable: true here
      // would let RN's URL polyfill overwrite this getter right back.
      configurable: false,
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
      configurable: false,
    });
  }
}

// Suppress the "Failed to set polyfill. X is not configurable." errors that
// RN's polyfillGlobal() logs when react-native-url-polyfill (pulled in by
// stream-chat) tries and fails to override the native URL/URLSearchParams
// locked above. The lock is intentional, so this noise is expected and safe
// to hide.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith('Failed to set polyfill.')) {
    return;
  }
  originalConsoleError(...args);
};

// Import the actual expo entry point.
// NOTE: must use require(), not `import`, since ES import declarations are
// hoisted above all other statements by Babel/Metro's CommonJS transform —
// an `import` here would run before the URL-locking code above, defeating it.
require('expo-router/entry');
