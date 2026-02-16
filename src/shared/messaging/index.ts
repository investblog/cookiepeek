import { browser } from 'wxt/browser';

export type { Message, MessageMap, MessageResponse, MessageType } from './protocol';

export function sendMessageSafe<T = unknown>(message: {
  type: string;
  payload?: unknown;
}): Promise<T & { __error?: string }> {
  return browser.runtime.sendMessage(message).then(
    (response: any) => response as T & { __error?: string },
    (err: Error) => {
      console.warn('sendMessageSafe:', err.message);
      return { __error: err.message } as T & { __error: string };
    },
  );
}
