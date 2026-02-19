import { flashBadge, updateBadgeForTab } from '@background/badge';
import { deleteCookie, deleteCookies, getCookiesForTab, setCookie, toCookieRecord } from '@background/cookies';
import { decodeValue } from '@background/decoder';
import { formatCookies } from '@background/formats';
import { importCookies } from '@background/importer';
import { MAX_CHANGE_LOG } from '@shared/constants';
import type { CookieChangeEvent } from '@shared/types/cookies';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  const changeLog: CookieChangeEvent[] = [];

  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    await updateBadgeForTab(tabId);
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      await updateBadgeForTab(tabId);
    }
  });

  browser.cookies.onChanged.addListener(async (changeInfo) => {
    const type = changeInfo.removed ? 'removed' : 'changed';
    const cookie = toCookieRecord(changeInfo.cookie);
    const event: CookieChangeEvent = { type, cookie, timestamp: Date.now() };

    changeLog.push(event);
    if (changeLog.length > MAX_CHANGE_LOG) {
      changeLog.splice(0, changeLog.length - MAX_CHANGE_LOG);
    }

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await updateBadgeForTab(tab.id);
        void flashBadge(tab.id);
      }
    } catch {
      // Tab may not be available
    }

    try {
      await browser.runtime.sendMessage({
        type: 'cookiepeek:cookie-changed',
        payload: event,
      });
    } catch {
      // Popup may be closed
    }
  });

  browser.runtime.onMessage.addListener(((message: any, _sender: any, sendResponse: any) => {
    const type = message?.type;
    const payload = message?.payload;

    if (type === 'cookiepeek:get-cookies') {
      getCookiesForTab(payload.tabId)
        .then((cookies) => sendResponse({ cookies }))
        .catch((err: unknown) => sendResponse({ cookies: [], error: (err as Error).message }));
      return true;
    }

    if (type === 'cookiepeek:set-cookie') {
      setCookie(payload.cookie, payload.url)
        .then(() => sendResponse({ success: true }))
        .catch((err: unknown) => sendResponse({ success: false, error: (err as Error).message }));
      return true;
    }

    if (type === 'cookiepeek:delete-cookie') {
      deleteCookie(payload.name, payload.url, payload.storeId)
        .then(() => sendResponse({ success: true }))
        .catch((err: unknown) => sendResponse({ success: false, error: (err as Error).message }));
      return true;
    }

    if (type === 'cookiepeek:delete-cookies') {
      deleteCookies(payload.cookies)
        .then((result: { deleted: number; errors: string[] }) => sendResponse(result))
        .catch((err: unknown) => sendResponse({ deleted: 0, errors: [(err as Error).message] }));
      return true;
    }

    if (type === 'cookiepeek:decode-value') {
      const decoded = decodeValue(payload.value, payload.forceMode);
      sendResponse(decoded);
      return false;
    }

    if (type === 'cookiepeek:export-cookies') {
      const output = formatCookies(payload.cookies, payload.format);
      sendResponse({ output });
      return false;
    }

    if (type === 'cookiepeek:import-cookies') {
      importCookies(payload.input, payload.format, payload.url)
        .then((result: { imported: number; errors: string[] }) => sendResponse(result))
        .catch((err: unknown) => sendResponse({ imported: 0, errors: [(err as Error).message] }));
      return true;
    }

    if (type === 'cookiepeek:get-change-log') {
      const domain = payload?.domain as string | undefined;
      const filtered = domain
        ? changeLog.filter((e) => e.cookie.domain === domain || e.cookie.domain === `.${domain}`)
        : changeLog;
      sendResponse({ log: filtered });
      return false;
    }

    sendResponse({ error: 'Unknown message type' });
    return false;
  }) as any);
});
