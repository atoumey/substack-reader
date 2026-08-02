/**
 * Optional Cloudflare Pages Worker for zero-dependency CORS proxying
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          }
        });
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
