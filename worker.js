// EveSynapse maintenance redirect (Cloudflare Worker).
//
// Passes every request through to the tunnel origin untouched.
// Only when the origin cannot answer (the app service down, or
// the box rebooting for the daily security patches: Cloudflare
// answers 502 or 530, or the fetch itself fails) does it step in:
//
//   - Page loads on evesynapse.app and synap6.is-a.dev are
//     redirected to the status page, which shows the maintenance
//     notice and updates itself when the site is back.
//   - api.evesynapse.app gets a JSON 503 naming the status page,
//     so API clients never follow a redirect into HTML.
//   - Anything else (assets, posts) gets a plain 503.
//
// Deploy: wrangler deploy (see README.md). The routes live in
// wrangler.toml: evesynapse.app/* and api.evesynapse.app/*.
// synap6.is-a.dev is not covered: that zone is not ours, so no
// Worker route can attach to it.

const STATUS_PAGE = "https://health.evesynapse.app";

export default {
  async fetch(request) {
    let response = null;
    try {
      response = await fetch(request);
    } catch (err) {
      response = null; // origin unreachable at the edge
    }
    if (response && response.status !== 502 && response.status !== 503 && response.status !== 530) {
      return response;
    }
    const url = new URL(request.url);
    if (url.hostname === "api.evesynapse.app") {
      return new Response(
        JSON.stringify({ error: "down_for_maintenance", status: STATUS_PAGE }),
        { status: 503, headers: { "content-type": "application/json", "retry-after": "300" } }
      );
    }
    const dest = request.headers.get("sec-fetch-dest");
    if (request.method === "GET" && (dest === "document" || dest === "" || dest === null)) {
      return Response.redirect(STATUS_PAGE, 302);
    }
    return new Response("Down for maintenance. Live status: " + STATUS_PAGE, {
      status: 503,
      headers: { "content-type": "text/plain", "retry-after": "300" },
    });
  },
};
