import { Agent, request as httpsRequest } from 'node:https';
import { assertEnv } from '@/shared/config/assert-env';
import { ConfigurationError, ExternalApiError } from '@/shared/errors';

/**
 * EFI's Pix API requires mutual TLS on every call, token included, so it
 * cannot go through global `fetch`. `node:https` lets us attach the client
 * certificate directly and keeps the dependency count at zero.
 */

let cachedAgent: Agent | null = null;

function buildAgent(): Agent {
  const pfxBase64 = process.env.EFI_CERT_PFX_BASE64;
  const pemBase64 = process.env.EFI_CERT_PEM_BASE64;

  if (pfxBase64) {
    return new Agent({
      pfx: Buffer.from(pfxBase64, 'base64'),
      passphrase: process.env.EFI_CERT_PASSPHRASE || undefined,
      keepAlive: true,
    });
  }

  if (pemBase64) {
    const pem = Buffer.from(pemBase64, 'base64');
    return new Agent({ cert: pem, key: pem, keepAlive: true });
  }

  throw new ConfigurationError('EFI_CERT_PFX_BASE64 (ou EFI_CERT_PEM_BASE64)');
}

function getAgent(): Agent {
  if (!cachedAgent) cachedAgent = buildAgent();
  return cachedAgent;
}

export function getEfiBaseUrl(): string {
  return process.env.EFI_PIX_BASE_URL || 'https://pix.api.efipay.com.br';
}

interface EfiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export async function efiRequest<T>({
  method,
  path,
  headers = {},
  body,
  timeoutMs = 15_000,
}: EfiRequestOptions): Promise<T> {
  const url = new URL(path, getEfiBaseUrl());
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise<T>((resolve, reject) => {
    const req = httpsRequest(
      {
        agent: getAgent(),
        method,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        headers: {
          Accept: 'application/json',
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 0;

          if (status < 200 || status >= 300) {
            reject(
              new ExternalApiError('EFI', `HTTP ${status} em ${method} ${url.pathname}`, {
                status,
                body: raw.slice(0, 600),
              })
            );
            return;
          }

          if (!raw) {
            resolve({} as T);
            return;
          }

          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            reject(new ExternalApiError('EFI', 'Resposta não é JSON válido.', { body: raw.slice(0, 300) }));
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new ExternalApiError('EFI', `Timeout em ${method} ${url.pathname}`));
    });
    req.on('error', (err) =>
      reject(
        err instanceof ExternalApiError ? err : new ExternalApiError('EFI', (err as Error).message)
      )
    );

    if (payload) req.write(payload);
    req.end();
  });
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let token: { value: string; expiresAt: number } | null = null;

export async function getEfiAccessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 30_000) return token.value;

  const clientId = assertEnv('EFI_CLIENT_ID');
  const clientSecret = assertEnv('EFI_CLIENT_SECRET');
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await efiRequest<TokenResponse>({
    method: 'POST',
    path: '/oauth/token',
    headers: { Authorization: `Basic ${basic}` },
    body: { grant_type: 'client_credentials' },
  });

  if (!res.access_token) throw new ExternalApiError('EFI', 'Token ausente na resposta.');

  token = {
    value: res.access_token,
    expiresAt: Date.now() + Math.max(60, res.expires_in ?? 3600) * 1000,
  };
  return token.value;
}

export async function efiAuthorized<T>(options: EfiRequestOptions): Promise<T> {
  const accessToken = await getEfiAccessToken();
  return efiRequest<T>({
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });
}

/** Lets a 401 recover once after a credential rotation invalidates the cache. */
export async function efiAuthorizedWithRetry<T>(options: EfiRequestOptions): Promise<T> {
  try {
    return await efiAuthorized<T>(options);
  } catch (err) {
    const status = (err as ExternalApiError)?.details as { status?: number } | undefined;
    if (status?.status === 401) {
      token = null;
      return efiAuthorized<T>(options);
    }
    throw err;
  }
}
