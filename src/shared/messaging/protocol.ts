import type { CookieRecord, DecodedValue, DecodeMode, ExportFormat } from '../types/cookies';

export interface MessageMap {
  'cookiepeek:get-cookies': {
    request: { tabId: number };
    response: { cookies: CookieRecord[]; error?: string };
  };
  'cookiepeek:set-cookie': {
    request: { cookie: CookieRecord; url: string };
    response: { success: boolean; error?: string };
  };
  'cookiepeek:delete-cookie': {
    request: { name: string; url: string; storeId?: string };
    response: { success: boolean; error?: string };
  };
  'cookiepeek:delete-cookies': {
    request: { cookies: Array<{ name: string; url: string; storeId?: string }> };
    response: { deleted: number; errors: string[] };
  };
  'cookiepeek:decode-value': {
    request: { value: string; forceMode?: DecodeMode };
    response: DecodedValue;
  };
  'cookiepeek:export-cookies': {
    request: { cookies: CookieRecord[]; format: ExportFormat };
    response: { output: string; error?: string };
  };
  'cookiepeek:import-cookies': {
    request: { input: string; format: 'json' | 'netscape'; url: string };
    response: { imported: number; errors: string[] };
  };
}

export type MessageType = keyof MessageMap;

export interface Message<T extends MessageType = MessageType> {
  type: T;
  payload?: MessageMap[T]['request'];
}

export type MessageResponse<T extends MessageType> = MessageMap[T]['response'];
