// Midtrans configuration for frontend
export const MIDTRANS_CONFIG = {
  clientKey:
    process.env.NODE_ENV === "production"
      ? "Mid-client-YOUR_PRODUCTION_CLIENT_KEY" // Replace with actual production client key
      : "SB-Mid-client-YOUR_SANDBOX_CLIENT_KEY", // Replace with actual sandbox client key

  snapUrl:
    process.env.NODE_ENV === "production"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js",

  isProduction: process.env.NODE_ENV === "production",
};

// Load Midtrans SNAP script
export const loadMidtransScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${MIDTRANS_CONFIG.snapUrl}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = MIDTRANS_CONFIG.snapUrl;
    script.setAttribute("data-client-key", MIDTRANS_CONFIG.clientKey);

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans script"));

    document.head.appendChild(script);
  });
};

// Payment helper functions
export const initMidtransPayment = async (
  snapToken: string,
  callbacks: {
    onSuccess?: (result: any) => void;
    onPending?: (result: any) => void;
    onError?: (result: any) => void;
    onClose?: () => void;
  }
) => {
  try {
    await loadMidtransScript();

    // @ts-ignore
    if (window.snap) {
      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: callbacks.onSuccess || (() => {}),
        onPending: callbacks.onPending || (() => {}),
        onError: callbacks.onError || (() => {}),
        onClose: callbacks.onClose || (() => {}),
      });
    } else {
      throw new Error("Midtrans SNAP not available");
    }
  } catch (error) {
    console.error("Error initializing Midtrans payment:", error);
    throw error;
  }
};
