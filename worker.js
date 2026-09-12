const KEY = 'site-content-v1';
const DEFAULT_CONTENT = {
  updatedAt: null,
  notice: { enabled: false, text: '' },
  dailyLunch: { enabled: false, soldOut: false, name: '', price: '', description: '', image: '' },
  specials: []
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin'
    }
  });
}

function text(v, max = 180) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function image(v) {
  if (typeof v !== 'string' || !v) return '';
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(v)) return '';
  if (v.length > 900000) return '';
  return v;
}

function cleanItem(v = {}) {
  return {
    enabled: !!v.enabled,
    soldOut: !!v.soldOut,
    name: text(v.name, 60),
    price: text(v.price, 30),
    description: text(v.description, 180),
    image: image(v.image)
  };
}

function cleanContent(v = {}) {
  return {
    updatedAt: new Date().toISOString(),
    notice: { enabled: !!(v.notice && v.notice.enabled), text: text(v.notice && v.notice.text, 180) },
    dailyLunch: cleanItem(v.dailyLunch),
    specials: (Array.isArray(v.specials) ? v.specials : []).slice(0, 5).map(cleanItem)
  };
}

async function sameSecret(a, b) {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b))
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function handleApi(request, env) {
  if (!env.SITE_CONTENT) return json({ error: 'SITE_CONTENT が未設定です。Cloudflare KV binding を確認してください。' }, 500);

  if (request.method === 'GET') {
    const stored = await env.SITE_CONTENT.get(KEY, 'json');
    return json(stored || DEFAULT_CONTENT);
  }

  if (request.method === 'POST') {
    if (!env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD が未設定です。CloudflareのSecretを設定してください。' }, 500);
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== new URL(request.url).host) return json({ error: '許可されていない送信元です。' }, 403);
      } catch (_) { return json({ error: '送信元を確認できません。' }, 403); }
    }
    const supplied = request.headers.get('x-admin-password') || '';
    if (!(await sameSecret(supplied, env.ADMIN_PASSWORD))) return json({ error: '管理パスワードが違います。' }, 401);
    const length = Number(request.headers.get('content-length') || 0);
    if (length && length > 6500000) return json({ error: '画像を含むデータ容量が大きすぎます。' }, 413);
    let body;
    try { body = await request.json(); } catch (_) { return json({ error: '送信データを読み込めませんでした。' }, 400); }
    const cleaned = cleanContent(body);
    const encoded = JSON.stringify(cleaned);
    if (encoded.length > 6000000) return json({ error: '画像を含むデータ容量が大きすぎます。' }, 413);
    await env.SITE_CONTENT.put(KEY, encoded);
    return json({ ok: true, content: cleaned });
  }

  return json({ error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/content') return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};
