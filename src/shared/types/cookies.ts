export interface CookieRecord {
  name: string;
  value: string;
  domain: string;
  path: string;
  expirationDate?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSiteValue;
  storeId?: string;
  hostOnly?: boolean;
}

export type SameSiteValue = 'no_restriction' | 'lax' | 'strict' | 'unspecified';

export type SameSiteLabel = 'None' | 'Lax' | 'Strict' | 'Unspecified';

export const SAMESITE_LABEL_MAP: Record<SameSiteValue, SameSiteLabel> = {
  no_restriction: 'None',
  lax: 'Lax',
  strict: 'Strict',
  unspecified: 'Unspecified',
};

export type ExportFormat = 'json' | 'netscape' | 'antidetect' | 'header';

export type DecodeMode = 'jwt' | 'base64' | 'url' | 'raw';

export interface DecodedValue {
  mode: DecodeMode;
  raw: string;
  decoded: string;
  validModes: DecodeMode[];
  jwtHeader?: Record<string, unknown>;
  jwtPayload?: Record<string, unknown>;
  jwtExpiry?: string;
  error?: string;
}

export type SortField = 'name' | 'domain' | 'path' | 'expires' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
