type Env = {
  COURSE_BUCKET: R2Bucket;
  VIDEO_TOKEN_SECRET: string;
};

function base64urlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function verifyJwt(token: string, secret: string) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, base64urlToBytes(signature), new TextEncoder().encode(`${header}.${payload}`));
  if (!valid) return null;
  const claims = JSON.parse(new TextDecoder().decode(base64urlToBytes(payload))) as { courseId: string; videoId: string; exp: number };
  return claims.exp * 1000 > Date.now() ? claims : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return new Response('Forbidden', { status: 403 });
    const match = url.pathname.match(/^\/courses\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) return new Response('Not found', { status: 404 });
    const [, courseId, videoId, file] = match;
    const claims = await verifyJwt(token, env.VIDEO_TOKEN_SECRET);
    if (!claims || claims.courseId !== courseId || claims.videoId !== videoId) return new Response('Forbidden', { status: 403 });
    const key = `courses/${courseId}/${videoId}/${file}`;
    const object = await env.COURSE_BUCKET.get(key);
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('cache-control', 'private, max-age=30');
    headers.set('access-control-allow-origin', '*');
    return new Response(object.body, { headers });
  },
};
