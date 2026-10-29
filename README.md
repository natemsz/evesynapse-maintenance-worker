# EveSynapse maintenance redirect

A Cloudflare Worker that sits on the `evesynapse.app` routes and
passes every request through to the tunnel origin untouched. Only
when the origin cannot answer (the app service down, or the box
rebooting for the daily security patches, when Cloudflare answers
502 or 530) does it step in:

- Page loads on `evesynapse.app` are redirected to the status page
  at https://health.evesynapse.app, which shows the maintenance
  notice and updates itself when the site is back.
- `api.evesynapse.app` gets a JSON 503 naming the status page, so
  API clients never follow a redirect into HTML.
- Anything else (assets, posts) gets a plain 503.

`synap6.is-a.dev` is not covered: that zone belongs to the is-a.dev
service, so no Worker route can attach to it.

## Deploy

```sh
npm install
npx wrangler login
npx wrangler deploy
```

The routes are declared in `wrangler.toml`, so the deploy attaches
the Worker to `evesynapse.app/*` and `api.evesynapse.app/*` in the
same step.

## Disclosure

Built with AI assistance for productivity, the same standing
disclosure as the EveSynapse project itself.
