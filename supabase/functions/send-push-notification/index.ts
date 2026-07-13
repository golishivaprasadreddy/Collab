const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

// Convert base64url to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const raw = atob(padded);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

// Create JWT for VAPID
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64url: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64urlToUint8Array(privateKeyBase64url);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    await convertRawToPkcs8(privateKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format for JWT
  const sigArray = new Uint8Array(signature);
  let sigB64: string;
  if (sigArray.length === 64) {
    sigB64 = uint8ArrayToBase64url(sigArray);
  } else {
    // DER encoded - extract r and s
    const r = extractDerInt(sigArray, 3);
    const s = extractDerInt(sigArray, 3 + 1 + sigArray[3] + 1);
    const rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
    sigB64 = uint8ArrayToBase64url(rawSig);
  }

  return `${unsignedToken}.${sigB64}`;
}

function extractDerInt(buf: Uint8Array, offset: number): Uint8Array {
  const len = buf[offset + 1];
  return buf.slice(offset + 2, offset + 2 + len);
}

function padTo32(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) return bytes.slice(bytes.length - 32);
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

async function convertRawToPkcs8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // Wrap raw 32-byte EC private key in PKCS8 DER structure
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(pkcs8Header.length + rawKey.length);
  result.set(pkcs8Header);
  result.set(rawKey, pkcs8Header.length);
  return result.buffer;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey);
    const vapidPubBytes = base64urlToUint8Array(vapidPublicKey);

    // Encrypt the payload using Web Push encryption
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

    // Generate local ECDH key pair
    const localKey = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    const localPublicKey = await crypto.subtle.exportKey('raw', localKey.publicKey);

    // Import subscriber's public key
    const subscriberPubKey = await crypto.subtle.importKey(
      'raw',
      base64urlToUint8Array(subscription.keys.p256dh),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: subscriberPubKey },
      localKey.privateKey,
      256
    );

    const authSecret = base64urlToUint8Array(subscription.keys.auth);

    // HKDF-based key derivation (simplified Web Push encryption)
    const ikm = new Uint8Array(sharedSecret);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // PRK = HMAC-SHA-256(auth_secret, shared_secret)
    const authKey = await crypto.subtle.importKey('raw', authSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    
    // Create info for key derivation
    const keyInfoBuf = new Uint8Array([
      ...new TextEncoder().encode('Content-Encoding: aes128gcm\x00'),
    ]);
    const nonceInfoBuf = new Uint8Array([
      ...new TextEncoder().encode('Content-Encoding: nonce\x00'),
    ]);

    // Simplified: Use the shared secret directly with AES-GCM
    const keyMaterial = await crypto.subtle.importKey('raw', ikm.slice(0, 16), 'AES-GCM', false, ['encrypt']);
    const iv = salt.slice(0, 12);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      keyMaterial,
      payloadBytes
    );

    // Build the encrypted content
    const localPubBytes = new Uint8Array(localPublicKey);
    const recordSize = new Uint8Array(4);
    new DataView(recordSize.buffer).setUint32(0, 4096);
    
    const body = new Uint8Array(
      salt.length + 4 + 1 + localPubBytes.length + new Uint8Array(encrypted).length
    );
    let offset = 0;
    body.set(salt, offset); offset += salt.length;
    body.set(recordSize, offset); offset += 4;
    body[offset] = localPubBytes.length; offset += 1;
    body.set(localPubBytes, offset); offset += localPubBytes.length;
    body.set(new Uint8Array(encrypted), offset);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Push failed (${response.status}): ${text}`);
      return false;
    }
    await response.text();
    return true;
  } catch (err) {
    console.error('Push send error:', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, data, tag } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('push_enabled', true);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No push subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    const payload: PushPayload = {
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data || {},
      tag: tag || undefined,
    };

    for (const token of tokens) {
      if (!token.push_token) continue;
      
      try {
        const subscription = JSON.parse(token.push_token) as PushSubscription;
        const success = await sendWebPush(
          subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          'mailto:noreply@collabio.app'
        );
        if (success) sent++;
      } catch (err) {
        console.error('Error sending to token:', err);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: tokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
