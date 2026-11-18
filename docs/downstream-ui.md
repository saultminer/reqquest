# Building your UI on `@reqquest/ui`

`@reqquest/ui` is the whole ReqQuest application, not just a component library. Your project supplies:
- your prompt components
- your registry
- optionally, your own routes

The package supplies everything else. That includes the routes and app shell, Svelte, SvelteKit, Vite and their configuration, and the nginx runtime.

You do not install or configure that toolchain. Its versions are the ones the ReqQuest release was built and tested with, and they move only when you upgrade `@reqquest/ui`.

## What your UI project contains

```
ui/
├── package.json                  dependencies: { "@reqquest/ui": "1.16.0" } and nothing else
├── package-lock.json
├── tsconfig.json                 { "extends": "./.reqquest/tsconfig.json" } (written for you)
├── reqquest-overrides.lock.json  only if you override routes or replace a runtime file (written for you, commit it)
├── src/
│   ├── local/                    required: index.ts exporting `uiRegistry`, plus your components
│   ├── lib/                      optional: your own shared code, imported as $lib
│   └── routes/                   optional: overrides and additions, see below
├── static/                       optional: merged over ReqQuest's static files
└── runtime/                      optional: additions to the nginx image, see "Customizing nginx and startup"
```

**Gitignore `.reqquest/`, `build/` and `build-runtime/`.**

Do not add the following:
- `svelte`, `@sveltejs/kit`, `vite` or `@sveltejs/vite-plugin-svelte` to your dependencies
- a `svelte.config.js`, `vite.config.*`, `tailwind.config.js` or `postcss.config.js`

### Why you must not declare the toolchain

`svelte`, `@sveltejs/kit`, `vite` and `@sveltejs/vite-plugin-svelte` are exact-pinned peer dependencies of `@reqquest/ui`. npm installs them for you as single top-level copies.

If your `package.json` declares a different version, npm prints `ERESOLVE overriding peer dependency` as a warning and installs yours anyway. Every `reqquest-ui` command then refuses to run and names both versions. Remove the entry and reinstall.

Pin `@reqquest/ui` itself exactly as well. Its version is your toolchain version.

## Commands

Run all commands from the UI project root.

| command | what it does |
|---|---|
| `npx reqquest-ui dev [--host 0.0.0.0 --port 80]` | Assembles `.reqquest/`, then starts the Vite dev server. Edits to `src/local` hot-reload directly. Edits to `src/routes` and `static` re-sync automatically. |
| `npx reqquest-ui build` | Strict sync, then the registry type gate, then the production build. The site goes to `build/`; `nginx.conf` and `apply-env.sh` go to `build-runtime/`. |
| `npx reqquest-ui check` | svelte-check over everything, including `src/local` and your routes. |
| `npx reqquest-ui check-registry` | Fails if `src/local/index.ts` has a type error, such as a prompt the API defines that you have not registered. `build` runs it for you. |
| `npx reqquest-ui sync [--strict] [--accept]` | Only assembles `.reqquest/`; the other commands run it first. |

### `.reqquest/`

`.reqquest/` is a generated SvelteKit project. Its files are read-only and are rewritten on every sync, so don't edit them.

`src/local` and `src/lib` are not copied into it. They are aliased in place (`$local`, `$lib`), so your editor, HMR and the type checker all work on the files you actually edit.

## Overriding and adding routes

Your `src/routes` is laid over ReqQuest's routes. To see the base routes, browse `node_modules/@reqquest/ui/app/src/routes`.

| you want to | do this |
|---|---|
| add a page | Create it: `src/routes/reports/+page.svelte`. A path ReqQuest does not have is simply a new route. |
| change one file of a page | Create the same path: `src/routes/requests/+page.svelte`. Yours replaces that one file, and the base `requests/+page.ts` loader is kept. |
| replace a whole page or section | Add an empty `src/routes/requests/.reqquest-replace`. Every base file under `requests/` is dropped, and only yours remain. Use this when your page needs different load data than the base loader provides. |
| remove a page | In `package.json`: `"reqquest": { "disableRoutes": ["roles/users"] }`. |

**Import through aliases, not relative paths that leave `src/routes`.** Your route files are copied into `.reqquest/src/routes` before building, so `../../lib/x` would point somewhere else. Sync refuses such imports and names them.

Use these instead:
- `$lib` for your `src/lib`
- `$local` for your registry and components
- `@reqquest/ui` for the library

Relative imports between files inside `src/routes` are fine. A file you add can also import a base file next to it, such as `../ApproveLayout.svelte`, because both end up in the same tree.

**`src/internal` cannot be overridden.** Every base route depends on it, so it is not a stable surface. If you need something from it, ask for it to be exported from `@reqquest/ui`.

### Overrides are forks: `reqquest-overrides.lock.json`

When you override or replace a base file, you take ownership of a copy of it. Sync records each forked base file's hash in `reqquest-overrides.lock.json`. **Commit this file.**

When an upgrade changes a base file underneath your override, sync warns you and names the file to compare against. Review the change, carry over whatever you need, then run `npx reqquest-ui sync --accept`.

`build` runs sync in `--strict` mode. Strict mode fails if the lockfile is out of date in any way:
- a drifted override
- an override that was never recorded
- a recorded override that no longer exists

Drift therefore stops your image build instead of shipping unnoticed.

## Dockerfile

```dockerfile
FROM node:24-alpine AS build
WORKDIR /usr/app
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/src src
# drop this line if you have no ui/static
COPY ui/static static
# the lockfile is optional; the wildcard lets this COPY succeed without it (package.json always matches)
COPY ui/package.json ui/reqquest-overrides.lock.json* ./
RUN npx reqquest-ui build

FROM alpine:3.22
RUN apk update && apk upgrade && apk add brotli envsubst grep nginx nginx-mod-http-brotli
COPY --from=build /usr/app/build /usr/share/nginx/html
COPY --from=build /usr/app/build-runtime/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/app/build-runtime/apply-env.sh /apply-env.sh
# Only needed if you add a runtime/ folder (extra nginx config or startup scripts) - see
# "Customizing nginx and startup" below. Uncomment both when you do.
# COPY --from=build /usr/app/build-runtime/nginx/ /etc/nginx/reqquest/
# COPY --from=build /usr/app/build-runtime/apply-env.d/ /apply-env.d/
CMD ["/bin/sh", "-c", "/apply-env.sh && nginx -g 'daemon off;'"]
```

For a dev image, use the same build stage up to `npm ci`, then:

```dockerfile
CMD ["npx", "reqquest-ui", "dev", "--host", "0.0.0.0", "--port", "80"]
```

Bind-mount `ui/src` and `ui/static` into `/usr/app`.

The build needs Node 22 or later.

## Customizing nginx and startup

ReqQuest's `nginx.conf` and `apply-env.sh` change between releases; the applicant guide redirect, for one, lives in them. Add to them instead of replacing them, so you keep receiving those changes. Put your additions in a `runtime/` folder in your project root:

| Your file | What it does |
|---|---|
| `runtime/nginx/server.d/*.conf` | Included inside ReqQuest's `server` block. Use for extra `location`s and headers. |
| `runtime/nginx/http.d/*.conf` | Included inside ReqQuest's `http` block. Use for `map`, `upstream` and rate-limit zones. |
| `runtime/apply-env.d/*.sh` | Run with `sh` when the container starts, after ReqQuest's own steps, in name order. |
| `runtime/nginx.conf` | Replaces ReqQuest's file entirely. |
| `runtime/apply-env.sh` | Replaces ReqQuest's file entirely. |

`reqquest-ui build` copies these into `build-runtime/` next to ReqQuest's files.

- **Your Dockerfile must copy the drop-in folders.** They only reach the image through the two `COPY` lines for `build-runtime/nginx/` and `build-runtime/apply-env.d/`, which the sample Dockerfile above carries commented out. Uncomment both when you add a `runtime/` folder; if your Dockerfile predates them, add them. With the lines commented or missing the image still builds and runs; your drop-ins are simply not in it.
- **A startup script that fails stops the container.** It exits non-zero and nginx never starts, so a broken step is visible instead of half-applied.
- **You cannot redefine a location ReqQuest already defines.** nginx refuses to start on a duplicate `location`. Add new paths; to change an existing one you have to replace `nginx.conf`.
- **Replacing a file forks it.** It is recorded in `reqquest-overrides.lock.json` exactly like a route override: when an upgrade changes ReqQuest's version, sync warns you, `build` fails, and you carry the change over and run `npx reqquest-ui sync --accept`. Compare against `node_modules/@reqquest/ui/app/runtime/`.
- **Anything else in `runtime/` fails the build.** A misspelled file name would otherwise be ignored without a word.
- **None of this applies under `reqquest-ui dev`.** The dev server is Vite, not nginx.

## Environment

`PUBLIC_*` variables use ReqQuest's runtime-substitution scheme: placeholders are baked in at build time, and `apply-env.sh` replaces them when the container starts. Set them on the container as before.

A `.env` in your project root is merged over ReqQuest's template by key, so you only list what you add or change.

## Applicant guide for AI agents

ReqQuest can publish a Markdown guide that an applicant's AI agent reads to explain a prompt or the next step. It is off by default. Turn it on in your API:

```ts
await server.start({ appConfig: { applicantGuide: true, ... }, ... })
```

- The API renders the guide once at startup from your program, requirement and prompt definitions and serves it at `GET /help/applicant-guide.md`.
- Your UI needs no changes. `/help/applicant-guide.md` on the UI origin redirects to the API's copy without asking for a login: the dev server does it with a route in the app shell, and the built image does it in nginx, from a snippet `apply-env.sh` writes using `PUBLIC_API_BASE`.
- **It is public.** Anyone can read it without logging in. It contains titles, descriptions, default configuration, and the source of each applicant-facing requirement's `resolve` and prompt's `validate`, with comments removed. Reviewer-side requirements (PREAPPROVAL, APPROVAL, workflow) and their prompts are not described. An applicant rule that reads staff-provided data is still published in full, so it shows that staff prompt's key and how its answer is used (for example, that an override exists).
- It shows the defaults in your code. Values an administrator changed for a period, and requirements disabled for a period, are not reflected.
- If your API authenticates with `authenticateAll`, add `/help/applicant-guide.md` to `exceptRoutes`, otherwise the route answers 401.

## `package.json` options

All options live under a `"reqquest"` key. There are deliberately only two, and no way to change the toolchain:

- **`disableRoutes`**: base routes to remove (see above).
- **`basePath`**: serve the app under a sub-path, e.g. `"/apply"`. This is SvelteKit's `paths.base`.

## Upgrading

1. Bump `@reqquest/ui` and run `npm install`.
2. Run `npx reqquest-ui sync`. It warns about every route you overrode that changed upstream.
3. Review each one, then run `--accept`.
4. Commit the lockfile with the version bump.

Prompt-key coverage is covered separately: see [downstream-setup.md](downstream-setup.md).
