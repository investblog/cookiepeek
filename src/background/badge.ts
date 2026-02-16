import { BADGE_COLOR, BADGE_MAX_COUNT } from '@shared/constants';
import { browser } from 'wxt/browser';

/** Compat: Firefox MV2 uses browserAction, Chrome MV3 uses action */
const badgeApi = browser.action ?? browser.browserAction;

function formatBadgeText(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '';
  if (count > BADGE_MAX_COUNT) return `${BADGE_MAX_COUNT}+`;
  return String(count);
}

function isInternalUrl(url: string): boolean {
  return /^(chrome|about|edge|opera|moz-extension|chrome-extension):\/\//.test(url);
}

export async function updateBadgeForTab(tabId: number): Promise<void> {
  if (!badgeApi?.setBadgeText) return;
  if (typeof tabId !== 'number' || tabId < 0) return;

  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab?.url || isInternalUrl(tab.url)) {
      await badgeApi.setBadgeText({ tabId, text: '' });
      return;
    }

    const cookies = await browser.cookies.getAll({ url: tab.url });
    const text = formatBadgeText(cookies.length);
    await badgeApi.setBadgeText({ tabId, text });

    if (text) {
      await badgeApi.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    }
  } catch (error) {
    const err = error as Error;
    if (!err?.message?.includes('No tab with id')) {
      console.error('Badge update failed:', error);
    }
  }
}
