/**
 * Registers this app's webhook URL against the Pix key at EFI.
 *
 *   node scripts/register-efi-webhook.mjs https://seudominio.com.br
 *
 * Two things here are easy to get wrong:
 *
 *  1. EFI appends `/pix` to whatever URL you register, so the handler lives at
 *     /api/v1/webhooks/efi/pix and the URL you pass here must stop at
 *     /api/v1/webhooks/efi.
 *
 *  2. EFI validates mutual TLS on the call *back* to you. Vercel terminates TLS
 *     and cannot present a client certificate, so registration must be sent
 *     with `x-skip-mtls-checking: true` or every delivery fails. That is safe
 *     here only because the handler treats the payload as an unauthenticated
 *     hint and re-verifies each txid against EFI before releasing anything.
 */
import { Agent, request } from 'node:https';
import { readFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) {
  console.error('uso: node scripts/register-efi-webhook.mjs https://seudominio.com.br');
  process.exit(1);
}

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // Not present — rely on the ambient environment.
  }
}

const {
  EFI_CLIENT_ID,
  EFI_CLIENT_SECRET,
  EFI_PIX_KEY,
  EFI_CERT_PFX_BASE64,
  EFI_CERT_PEM_BASE64,
  EFI_CERT_PASSPHRASE,
  EFI_PIX_BASE_URL = 'https://pix.api.efipay.com.br',
} = process.env;

for (const [name, value] of Object.entries({ EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_PIX_KEY })) {
  if (!value) {
    console.error(`faltando ${name}`);
    process.exit(1);
  }
}

const agent = EFI_CERT_PFX_BASE64
  ? new Agent({
      pfx: Buffer.from(EFI_CERT_PFX_BASE64, 'base64'),
      passphrase: EFI_CERT_PASSPHRASE || undefined,
    })
  : EFI_CERT_PEM_BASE64
    ? (() => {
        const pem = Buffer.from(EFI_CERT_PEM_BASE64, 'base64');
        return new Agent({ cert: pem, key: pem });
      })()
    : null;

if (!agent) {
  console.error('faltando EFI_CERT_PFX_BASE64 ou EFI_CERT_PEM_BASE64');
  process.exit(1);
}

function call({ method, path, headers = {}, body }) {
  const url = new URL(path, EFI_PIX_BASE_URL);
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = request(
      {
        agent,
        method,
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          Accept: 'application/json',
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
            return;
          }
          resolve(raw ? JSON.parse(raw) : {});
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const basic = Buffer.from(`${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`).toString('base64');

const { access_token: token } = await call({
  method: 'POST',
  path: '/oauth/token',
  headers: { Authorization: `Basic ${basic}` },
  body: { grant_type: 'client_credentials' },
});

const webhookUrl = `${target.replace(/\/$/, '')}/api/v1/webhooks/efi`;

await call({
  method: 'PUT',
  path: `/v2/webhook/${encodeURIComponent(EFI_PIX_KEY)}`,
  headers: {
    Authorization: `Bearer ${token}`,
    'x-skip-mtls-checking': 'true',
  },
  body: { webhookUrl },
});

console.log(`webhook registrado: ${webhookUrl}`);
console.log(`EFI vai entregar em:  ${webhookUrl}/pix`);
