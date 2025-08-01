import { useEffect } from "react";

export const TrackingScripts = () => {
  useEffect(() => {
    const GA_MEASUREMENT_ID = "G-BJ7CS4RB6N";
    const FB_PIXEL_ID = "960408691867202";
    // Check if we're on the main.esensi domain (port 7000 in development)
    const isMainDomain =
      window.location.port === "7000" ||
      window.location.hostname.includes("main.esensi") ||
      window.location.hostname === "esensi.online" ||
      window.location.hostname.includes("esensi.local");

    if (!isMainDomain) return;

    // Load Google Analytics
    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    const gaConfig = document.createElement("script");
    gaConfig.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(gaConfig);

    // Load Meta Pixel
    const fbPixelScript = document.createElement("script");
    fbPixelScript.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbPixelScript);

    // Add noscript fallback for Meta Pixel
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    console.log("✅ Tracking scripts loaded for main.esensi domain");

    // Cleanup function
    return () => {
      // Remove scripts when component unmounts (though this rarely happens)
      const scripts = document.querySelectorAll(
        'script[src*="googletagmanager"], script[src*="fbevents"]'
      );
      scripts.forEach((script) => script.remove());
    };
  }, []);

  return null; // This component doesn't render anything
};

export default TrackingScripts;
