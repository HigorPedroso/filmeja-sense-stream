import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useGoogleAds = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);
};

export const useGoogleAdsPageView = () => {
  const trackConversion = (conversionId: string) => {
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': `AW-960025532/${conversionId}`
      });
    }
  };

  return { trackConversion };
};