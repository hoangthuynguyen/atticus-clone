/**
 * Google Apps Script Bridge
 * Allows React sidebar to call GAS functions via postMessage
 */

let callbackCounter = 0;
const pendingCallbacks = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

// Listen for responses from the GAS bridge (Sidebar.html)
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;

    if (data?.type === 'GAS_RESULT') {
      const cb = pendingCallbacks.get(data.callbackId);
      if (cb) {
        cb.resolve(data.result);
        pendingCallbacks.delete(data.callbackId);
      }
    }

    if (data?.type === 'GAS_ERROR') {
      const cb = pendingCallbacks.get(data.callbackId);
      if (cb) {
        cb.reject(new Error(data.error || 'Unknown GAS error'));
        pendingCallbacks.delete(data.callbackId);
      }
    }
  });
}

/**
 * Call a Google Apps Script function from the React sidebar.
 *
 * @param method - The GAS function name (e.g., 'exportEpub', 'getWordCount')
 * @param args - Arguments to pass to the function
 * @returns Promise resolving to the function's return value
 *
 * @example
 * const result = await callGas<{ downloadUrl: string }>('exportEpub', { theme: {} });
 */
export function callGas<T>(method: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackId = `cb_${++callbackCounter}_${Date.now()}`;
    pendingCallbacks.set(callbackId, {
      resolve: resolve as (v: unknown) => void,
      reject,
    });

    // Send message to parent (Sidebar.html) which forwards to google.script.run
    window.parent.postMessage(
      {
        type: 'GAS_CALL',
        method,
        args,
        callbackId,
      },
      '*'
    );

    // Timeout after 120s (exports can take a while)
    setTimeout(() => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        reject(new Error(`Request to ${method} timed out after 120 seconds`));
      }
    }, 120000);
  });
}

/**
 * Check if running inside Google Apps Script sidebar
 */
export function isInGasSidebar(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin restriction means we're in an iframe
  }
}
