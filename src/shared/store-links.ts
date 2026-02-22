export interface StoreInfo {
  url: string;
  icon: string;
  label: string;
}

const STORES: Record<string, StoreInfo> = {
  chrome: {
    url: 'https://chromewebstore.google.com/detail/cookiepeek/neokbinekbljibacbahpflmdhinjhjjh/reviews',
    icon: '/icons/chrome.svg',
    label: 'Chrome Web Store',
  },
  edge: {
    url: 'https://microsoftedge.microsoft.com/addons/detail/cachkpikjmlenneaknpganeffomgheig',
    icon: '/icons/edge.svg',
    label: 'Edge Add-ons',
  },
  firefox: {
    url: 'https://addons.mozilla.org/en-US/firefox/addon/cookiepeek/',
    icon: '/icons/mozilla.svg',
    label: 'Firefox Add-ons',
  },
  opera: {
    url: '',
    icon: '/icons/opera.svg',
    label: 'Opera Add-ons',
  },
};

export function getStoreInfo(): StoreInfo | null {
  const info = STORES[import.meta.env.BROWSER] ?? null;
  if (info && !info.url) return null;
  return info;
}
