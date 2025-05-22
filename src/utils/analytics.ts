export const trackConversion = (value: number = 9.99) => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-960025532/hgqyCLm5gcwaELyn48kD',
      'value': value,
      'currency': 'BRL'
    });
  }
};